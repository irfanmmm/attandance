import { useContext, useEffect, useState } from 'react';
import { Context } from '../Redux/Store';

type SettingObj = {
  'Agency Management': boolean;
  'Branch Management': boolean;
  'Individual Login': boolean;
  'Location Tracking': boolean;
  'Office Kit Integration': boolean;
};

export const useSettings = () => {
  const { state } = useContext(Context);
  const [outbut, setOutput] = useState<SettingObj>();
  const settings = state?.userData?.settings as {
    setting_name: string;
    value: boolean;
  }[];

  useEffect(() => {
    let data: any = {}
    settings.forEach(val => {
      data[val.setting_name] = val.value;
    });
    setOutput(data);
  }, [settings]);

  return outbut
};
