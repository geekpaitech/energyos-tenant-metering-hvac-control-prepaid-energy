import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
import Cookies from "js-cookie";

// 创建axios实例
const service = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? ""
      : "https://iot.geekpartytech.com",
  timeout: 10000,
});

// 防止重复处理10002和重复刷新
let isHandlingTokenExpired = false;
let hasRefreshed = false;

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    config.headers["Content-Type"] = "application/json";
    config.headers["userDeviceType"] = "PC";

    if (store.getters.token) {
      config.headers["X-Token"] = store.getters.token;
      config.headers["Authorization"] = store.getters.token;
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

    if (res.code === 200) {
      return res;
    } else if (res.code === 10002) {
      console.error("token过期:", res.msg);
      console.error("当前URL:", window.location.href);
      
      // 防止重复处理
      if (!isHandlingTokenExpired) {
        isHandlingTokenExpired = true;
        handleTokenExpiredSimple(res.msg || "您已在其他地方登录");
      }
      
      return Promise.reject(new Error(res.msg || "token过期"));
    } 
    else {
      console.error("接口错误:", res.msg || res.message || "Error");
      // return Promise.reject(new Error(res.msg || res.message || "Error"));
      return res;
    }
  },
  (error) => {
    let message = "请求失败";
    if (error.response) {
      message = `请求失败: ${error.response.status}`;
    } else if (error.request) {
      message = "网络错误，请检查网络连接";
    } else {
      message = error.message || "未知错误";
    }

    console.error("错误详情:", message);
    return Promise.reject(new Error(message));
  }
);

// 终极简单处理：跳首页 + 无痕刷新一次
function handleTokenExpiredSimple(message) {
  console.log('=== 终极简单处理：跳首页+刷新 ===');
  
  // 显示提示
  Message({
    message: message + '，正在重新加载...',
    type: 'warning',
    duration: 1500
  });
  
  // 清理必要的缓存
  quickCleanup();
  
  // 延迟跳转和刷新
  setTimeout(() => {
    jumpToHomeAndRefresh();
  }, 500);
}

// 快速清理必要缓存
function quickCleanup() {
  try {
    console.log('快速清理必要缓存...');
    
    // 只清理最必要的
    const TokenKey = "Admin-Token";
    Cookies.remove(TokenKey);
    localStorage.removeItem('selectedPlatform');
    
    // 清理用户token
    if (store.commit) {
      store.commit('user/SET_TOKEN', '');
      store.commit('user/SET_USER_INFO_LOADED', false);
    }
    
    console.log('必要缓存清理完成');
    
  } catch (error) {
    console.error('清理缓存出错:', error);
  }
}

// 跳转首页并无痕刷新一次
function jumpToHomeAndRefresh() {
  try {
    console.log('跳转首页并准备刷新...');
    
    // 重置处理标志
    isHandlingTokenExpired = false;
    
    // 跳转到首页
    window.location.hash = '/';
    
    // 防止重复刷新：检查是否已经刷新过
    const refreshFlag = 'token_expired_refreshed';
    const alreadyRefreshed = sessionStorage.getItem(refreshFlag);
    
    if (!alreadyRefreshed && !hasRefreshed) {
      console.log('执行无痕刷新...');
      
      // 设置刷新标记
      hasRefreshed = true;
      sessionStorage.setItem(refreshFlag, 'true');
      
      // 延迟刷新，让跳转先完成
      setTimeout(() => {
        console.log('开始刷新页面...');
        window.location.reload();
      }, 200);
      
    } else {
      console.log('已经刷新过，跳过重复刷新');
    }
    
  } catch (error) {
    console.error('跳转和刷新失败:', error);
    // 兜底：直接刷新
    window.location.reload();
  }
}

// 页面加载时清理刷新标记（避免影响正常使用）
window.addEventListener('load', () => {
  // 延迟清理，确保10002处理完成
  setTimeout(() => {
    const refreshFlag = 'token_expired_refreshed';
    if (sessionStorage.getItem(refreshFlag)) {
      sessionStorage.removeItem(refreshFlag);
      console.log('清理刷新标记');
    }
  }, 3000);
});

export default service;