export interface BaseDto {
  id: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CurrentUser {
  id: string;
  email: string;
  roles: string[];
}

export interface IFilter {
  name: string;
  type: string;
}

export interface IListQuery extends Record<string, unknown> {
  page: number;
  pageSize: number;
  total?: number;
  status?: string;
  tz?: string;
}

export interface IListDto {
  dataSource: Array<Record<string, unknown>>;
  pagination: IListQuery;
}

export enum TypeToken {
  Verify = 'verify',
  Refresh = 'refresh',
  ForgotPass = 'forgot_pass',
}

export enum LevelCourse {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum DurationCourse {}

export const DURATION_COURSE_LIST_OPTIONS = [
  {
    id: 1,
    name: '< 30 mins',
    value: '<30',
    minDuration: 0,
    maxDuration: 60 * 30,
  },
  {
    id: 2,
    name: '30 - 60 mins',
    value: '30-60',
    minDuration: 60 * 30,
    maxDuration: 60 * 60,
  },
  {
    id: 3,
    name: '1 - 2 hours',
    value: '1-2',
    minDuration: 60 * 60,
    maxDuration: 60 * 60 * 2,
  },
  {
    id: 4,
    name: '2 - 5 hours',
    value: '2-5',
    minDuration: 60 * 60 * 2,
    maxDuration: 60 * 60 * 5,
  },
  {
    id: 4,
    name: '5 - 10 hours',
    value: '5-10',
    minDuration: 60 * 60 * 5,
    maxDuration: 60 * 60 * 10,
  },
  {
    id: 5,
    name: '10+ hours',
    value: '10+',
    minDuration: 60 * 60 * 10,
    maxDuration: null,
  },
];
