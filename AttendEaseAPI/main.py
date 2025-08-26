from flask import Flask, request, jsonify
import face_recognition as fr
from pymongo import MongoClient
import numpy as np
from datetime import datetime
import pytz
import cv2
import threading

app = Flask(__name__)

# Global cache
KNOWN_IMAGES = []
KNOWN_ENCODINGS = []
lock = threading.Lock()

# ---------------- DB Connection ----------------
def get_database():
    CONNECTION_URL = "mongodb://localhost:27017/"
    client = MongoClient(CONNECTION_URL)
    return client['Attandance']

# ---------------- Load Encodings Once ----------------
def load_encodings():
    global KNOWN_IMAGES, KNOWN_ENCODINGS
    db = get_database()
    collection = db["encodings"]
    
    items = collection.find({})
    known_images = []
    encodings = []
    
    for doc in items:
        doc.pop("_id", None)
        for name, encoding in doc.items():
            known_images.append(name)
            encodings.append(np.array(encoding, dtype=np.float32))
    
    KNOWN_IMAGES = known_images
    KNOWN_ENCODINGS = encodings
    print(f"Loaded {len(KNOWN_IMAGES)} encodings into memory.")

# ---------------- Add Face ----------------
def update_face(img_name, add_img):
    image = fr.load_image_file(add_img)
    small_img = cv2.resize(image, (0, 0), fx=0.25, fy=0.25)

    try:
        face_locations = fr.face_locations(small_img, model='hog')
        if not face_locations:
            return False
        image_encoding = list(fr.face_encodings(small_img, face_locations)[0])
    except IndexError:
        return False

    # Insert into DB
    try:
        db = get_database()
        collection = db["encodings"]
        collection.insert_one({img_name: image_encoding})

        # Update global cache dynamically
        with lock:
            KNOWN_IMAGES.append(img_name)
            KNOWN_ENCODINGS.append(np.array(image_encoding, dtype=np.float32))
        return True
    except Exception as e:
        print(f"DB Error: {e}")
        return False

# ---------------- Compare Face ----------------
def compare_faces(base_img):
    image = fr.load_image_file(base_img)
    small_img = cv2.resize(image, (0, 0), fx=0.25, fy=0.25)

    try:
        face_locations = fr.face_locations(small_img, model='hog')
        if not face_locations:
            return False
        test_encoding = fr.face_encodings(small_img, face_locations)[0]
    except IndexError:
        return False

    if not KNOWN_ENCODINGS:
        return False

    results = fr.compare_faces(KNOWN_ENCODINGS, test_encoding, tolerance=0.45)
    if True in results:
        i = results.index(True)
        return KNOWN_IMAGES[i].split(".")[0]
    return False

# ---------------- Update Attendance ----------------
def update_attendance(user_id, status):
    IST = pytz.timezone('Asia/Kolkata')
    now = datetime.now(IST)
    moment_date = now.strftime("%d/%m/%Y")
    moment_time = now.strftime("%H:%M:%S")
    db = get_database()
    collection = db[moment_date]
    data = {"id": user_id, "status": status, "date": moment_date, "time": moment_time}
    try:
        collection.insert_one(data)
        return True
    except Exception as e:
        print(f"Attendance Error: {e}")
        return False

# ---------------- Routes ----------------
@app.route('/face_match', methods=['POST'])
def face_match():
    if 'file1' in request.files:
        file1 = request.files.get('file1')
        response = compare_faces(file1)
        if response:
            update_attendance(response, file1.filename)
        return jsonify({"status": response})
    return jsonify({"status": "No file provided"})

@app.route('/add_face', methods=['POST'])
def add_face():
    if 'file1' in request.files:
        file1 = request.files.get('file1')
        img_name = file1.filename.split(".")[0]
        response = update_face(img_name, file1)
        return jsonify({"status": response})
    return jsonify({"status": "No file provided"})

@app.route('/')
def home():
    return 'AttendEase APP API'

if __name__ == "__main__":
    load_encodings()  # Load once at startup
    app.run(debug=True, port=5001, host="0.0.0.0")
