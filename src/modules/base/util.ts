import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { customAlphabet } from 'nanoid';
import { join } from 'path';
import { phone } from 'phone';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);

const ALPHA_NUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DEFAULT_FORMAT = 'YYYY-MM-DD';

export const toId = () => customAlphabet(ALPHA_NUMERIC, 16)();

export const toSlug = (str: string) => {
  str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, 'A');
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, 'E');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/I|Í|Ì|Ĩ|Ị/g, 'I');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, 'O');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, 'U');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, 'Y');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/đ/g, 'd');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  str = str.replace(/\u02C6|\u0306|\u031B/g, '');
  return str
    .replace(/  +/g, '-')
    .replace(/ /g, '-')
    .replace(/[^A-Za-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
};

export const saveImageFile = async (
  uploads: Array<{ thumbUrl: string; name: string; type: string }>,
  prefix: string,
) => {
  const baseDir = join(process.cwd(), 'static', 'images', prefix);
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }
  const output = await Promise.allSettled(
    uploads.map((u) => {
      const regex = new RegExp(`^data:${u.type};base64,`);
      const base64 = u.thumbUrl.replace(regex, '');
      writeFileSync(join(baseDir, u.name), base64, { flag: 'w', encoding: 'base64' });
      return join('static', 'images', prefix, u.name);
    }),
  );
  return output.filter((o) => o.status === 'fulfilled').map((o) => o['value']);
};

export const removeImageFile = (images: string | null) => {
  if (images) {
    images.split(',').forEach((i) => {
      if (existsSync(join(process.cwd(), i))) unlinkSync(join(process.cwd(), i));
    });
  }
};

export const saveFile = (dir: string, filename: string, content: string) => {
  const baseDir = join(process.cwd(), 'static', dir);
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }
  writeFileSync(join(baseDir, filename), content, { flag: 'w', encoding: 'utf-8' });
};

export const readFile = (dir: string, filename: string) => {
  const file = join(process.cwd(), 'static', dir, filename);
  if (existsSync(file)) {
    return readFileSync(file, 'utf-8');
  }
  return '';
};

export const toCurrency = (val: number, currency = 'PHP') => {
  return val.toLocaleString('en-PH', { currency, style: 'currency', maximumFractionDigits: 0 });
};

export const dateToStr = (dt: Date | string | null, tzOffset: number, tz?: string | null, format?: string) => {
  let d = dayjs(dt);
  if (tz && parseInt(tz) !== tzOffset) d = d.add(+tz * -1, 'minute');
  return d.format(format || DEFAULT_FORMAT);
};

export const addDateToStr = (
  dt: Date | string | null,
  tzOffset: number,
  add: number,
  unit: any,
  tz?: string,
  format?: string,
) => {
  let d = dayjs(dt).add(add, unit);
  if (tz && parseInt(tz) !== tzOffset) d = d.add(+tz * -1, 'minute');
  return d.format(format || DEFAULT_FORMAT);
};

export const strToDate = (str: string, tzOffset: number, startOrEnd?: 'start' | 'end', tz?: string) => {
  let d = dayjs(str).utc();

  if (startOrEnd === 'start') {
    if (tz && parseInt(tz) !== tzOffset) d = d.add(+tz, 'minute');
  } else if (startOrEnd === 'end') {
    d = d.add(1, 'day');
    if (tz && parseInt(tz) !== tzOffset) {
      d = d.add(+tz, 'minute');
    }
  }

  return d.toDate();
};

export const strVNToUTC = (str: string) => {
  return dayjs(str).add(-7, 'hours').toDate();
};

export const isBefore = (d1: string, d2: string) => {
  return dayjs(d1).isSameOrBefore(d2);
};

export const diff = (d1: string | Date | null, unit: any, d2?: Date | string) => {
  return dayjs(d1).diff(d2, unit);
};

export const strToPhone = (str: string, country = 'PHL') => {
  const p = phone(str, { country });
  return p.isValid ? p.phoneNumber : str;
};

export const isPhoneValid = (str: string, country = 'PHL') => {
  return phone(str, { country }).isValid;
};

export const generateRandomString = (length: number): string => {
  const bytes = Math.ceil(length / 2);
  const randomString = randomBytes(bytes).toString('hex');

  return randomString.substring(0, length);
};
