import { registerAs } from '@nestjs/config';

export default registerAs('bull', () => {
  // Sử dụng cùng cấu trúc tương tự như redis config
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };

  // Thêm username nếu có
  if (process.env.REDIS_USERNAME) {
    config['username'] = process.env.REDIS_USERNAME;
  } else {
    // Cho Redis Cloud, nếu có password nhưng không có username,
    // thêm username mặc định 'default'
    if (process.env.REDIS_PASSWORD) {
      config['username'] = 'default';
    }
  }

  // Thêm password nếu có
  if (process.env.REDIS_PASSWORD) {
    config['password'] = process.env.REDIS_PASSWORD;
  }

  // Trả về cấu trúc redis cho Bull
  return {
    redis: config,
  };
});
