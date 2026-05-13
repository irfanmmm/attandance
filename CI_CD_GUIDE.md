# Android CI/CD Guide

This project uses **GitHub Actions** for automated building and testing. The pipeline is configured to run on every push to the `latest` branch and on every Pull Request.

## Workflow Overview

The pipeline (`.github/workflows/android.yml`) consists of two main jobs:

1.  **Lint & Test**: Ensures code quality by running ESLint and Jest tests.
2.  **Build Android**: 
    *   Compiles a **Debug APK** for every run.
    *   Attempts a **Release APK** build on pushes to the `latest` branch.

## How to use Artifacts

Once a workflow run completes:
1.  Go to the **Actions** tab in your GitHub repository.
2.  Select the latest run.
3.  Scroll down to the **Artifacts** section to download `app-debug` or `app-release`.

## Setting up Signed Release Builds

To successfully build a signed Release APK in GitHub Actions, you should:

1.  **Generate a Keystore**: If you haven't already, generate a release keystore.
2.  **Base64 Encode the Keystore**:
    ```bash
    openssl base64 -A -in your-release-key.keystore
    ```
3.  **Add GitHub Secrets**:
    Go to your repo **Settings > Secrets and variables > Actions** and add:
    *   `ANDROID_KEYSTORE`: The base64 string from step 2.
    *   `KEYSTORE_PASSWORD`: Your keystore password.
    *   `KEY_ALIAS`: Your key alias.
    *   `KEY_PASSWORD`: Your key password.

4.  **Update Workflow**:
    You will need to update the workflow to decode the keystore file before running the build.

### Example Update for Signed Builds

```yaml
      - name: Decode Keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE }}" | base64 --decode > android/app/release.keystore

      - name: Build Release APK
        run: |
          cd android
          ./gradlew assembleRelease \
            -PMYAPP_UPLOAD_STORE_FILE=release.keystore \
            -PMYAPP_UPLOAD_STORE_PASSWORD=${{ secrets.KEYSTORE_PASSWORD }} \
            -PMYAPP_UPLOAD_KEY_ALIAS=${{ secrets.KEY_ALIAS }} \
            -PMYAPP_UPLOAD_KEY_PASSWORD=${{ secrets.KEY_PASSWORD }}
```

## Automated Play Store Publishing

The pipeline is now set up to build an **Android App Bundle (AAB)** and can automatically upload it to the Google Play Store (Internal Sharing track).

### Prerequisites

1.  **Google Play Console Account**: You must have an active developer account.
2.  **Service Account**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new **Service Account**.
    *   Assign the role **Service Account User** and **Google Play Android Developer**.
    *   Create and download a **JSON Key** for this service account.
3.  **Link to Play Console**:
    *   In Google Play Console, go to **Setup > API Access**.
    *   Link the Google Cloud project.
    *   Grant the Service Account necessary permissions (usually "Release Manager").

### Configuration

Add the following secret to GitHub:
*   `SERVICE_ACCOUNT_JSON`: The entire content of the downloaded JSON key file.

### How it works

When you push to the `latest` branch, the workflow will:
1.  Build the signed AAB (using the keystore secrets setup earlier).
2.  Upload the AAB to the **Internal Sharing** track on Google Play.

> [!NOTE]
> You can change the `track` in `.github/workflows/android.yml` from `internal` to `production`, `beta`, or `alpha` once you are ready for a wider release.

---

## Troubleshooting

- **Build Failures**: Check the logs in the "Actions" tab. Common issues include Node version mismatches or missing environment variables.
- **Gradle Caching**: The workflow is configured to cache Gradle dependencies to speed up subsequent builds.
