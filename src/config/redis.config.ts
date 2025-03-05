import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  // Cấu hình cơ bản
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

  // Tạo URL Redis cho cache-manager
  let redisUrl = 'redis://';

  // Định dạng URL dựa trên thông tin xác thực
  if (config['username'] && config['password']) {
    redisUrl += `${config['username']}:${config['password']}@`;
  } else if (config['password']) {
    redisUrl += `default:${config['password']}@`;
  }

  // Thêm host và port
  redisUrl += `${config.host}:${config.port}`;

  // Trả về cấu hình với cả thuộc tính riêng lẻ và URL
  return {
    ...config,
    url: redisUrl,
  };
});
