import { useContext, useEffect, useState, useMemo } from 'react';
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
  const settings = state?.userData?.settings as {
    setting_name: string;
    value: boolean;
  }[];

  const output = useMemo(() => {
    if (!settings) return undefined;
    let data: any = {}
    settings.forEach(val => {
      data[val.setting_name] = val.value;
    });
    return data;
  }, [settings]);

  return output;
};
