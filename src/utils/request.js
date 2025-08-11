import axios from "axios";
import { MessageBox, Message } from "element-ui";
import store from "@/store";

// 创建axios实例
const service = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? ""
      : "https://iot-console.ajnelec.net", // 开发环境使用代理，生产环境使用完整URL
  // baseURL: process.env.NODE_ENV === 'development' ? '' : 'https://ebc.ajnelec.net', // 开发环境使用代理，生产环境使用完整URL
  timeout: 10000, // 请求超时时间增加到10秒
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么

    // 添加通用请求头
    config.headers["Content-Type"] = "application/json";
    config.headers["userDeviceType"] = "PC"; // 添加必需的设备类型头

    // 如果有token，添加到请求头
    if (store.getters.token) {
      config.headers["X-Token"] = store.getters.token;
      config.headers["Authorization"] = store.getters.token; // 同时添加Authorization头
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 处理真实接口的响应格式
    if (res.code === 200) {
      return res;
    } else if (res.code === 10002) {
      // token过期或无效
      console.error("token过期:", res.msg);
      return Promise.reject(new Error(res.msg || "token过期"));
    } else {
      // 其他错误
      console.error("接口错误:", res.msg || res.message || "Error");
      return Promise.reject(new Error(res.msg || res.message || "Error"));
    }
  },
  (error) => {
    // 网络错误或其他错误
    let message = "请求失败";
    if (error.response) {
      // 服务器响应错误
      message = `请求失败: ${error.response.status}`;
    } else if (error.request) {
      // 网络错误
      message = "网络错误，请检查网络连接";
    } else {
      message = error.message || "未知错误";
    }

    console.error("错误详情:", message);
    return Promise.reject(new Error(message));
  }
);

export default service;
