import router from "./router";
import store from "./store";
import { Message } from "element-ui";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import Cookies from "js-cookie";

NProgress.configure({ showSpinner: false });

const TokenKey = "Admin-Token";
function getToken() {
  return Cookies.get(TokenKey);
}

// 白名单路由
const whiteList = ["/login", "/404", "/401", "/switching"];

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  // 设置页面标题
  document.title =
    to.meta && to.meta.title
      ? `${to.meta.title} - 园区智慧物联`
      : "园区智慧物联";

  const hasToken = getToken();
  console.log("=== 路由守卫 ===");
  console.log("从:", from.path, "到:", to.path);
  console.log("Token:", hasToken ? "存在" : "不存在");

  if (hasToken) {
    if (to.path === "/login") {
      console.log("已登录，跳转首页");
      // 已登录用户访问登录页，重定向到首页
      const redirectPath = await getRedirectPath();
      next({ path: redirectPath, replace: true });
      NProgress.done();
      return;
    }

    // 检查是否有用户信息
    const hasUserInfo = store.getters.name && store.getters.roles && store.getters.roles.length > 0;
    const hasRoutes = store.getters.permission_routes && store.getters.permission_routes.length > 0;
    
    console.log("是否有用户信息:", hasUserInfo);
    console.log("是否有权限路由:", hasRoutes);

    if (hasUserInfo && hasRoutes) {
      // 已有用户信息和路由，直接通过
      console.log("用户信息和路由都存在，直接通过");
      next();
    } else {
      try {
        // 初始化用户信息和路由
        await initializeUserAndRoutes();
        
        // 处理根路径重定向
        if (to.path === "/" || to.path === "") {
          const redirectPath = await getRedirectPath();
          console.log("根路径重定向到:", redirectPath);
          next({ path: redirectPath, replace: true });
          return;
        }

        // 确保目标路由存在，否则重新导航
        console.log("重新导航到目标路由:", to.path);
        next({ ...to, replace: true });
        
      } catch (error) {
        console.error("初始化失败:", error);
        await handleAuthError(error, to.path);
        next({ path: "/login?redirect=" + encodeURIComponent(to.path), replace: true });
        NProgress.done();
      }
    }
  } else {
    console.log("无Token");
    if (whiteList.indexOf(to.path) !== -1) {
      console.log("在白名单中，直接通过");
      next();
    } else {
      console.log("不在白名单，跳转登录页");
      next({ path: "/login?redirect=" + encodeURIComponent(to.path), replace: true });
      NProgress.done();
    }
  }
  console.log("===============");
});

router.afterEach(() => {
  NProgress.done();
});

// 全局错误处理
router.onError((error) => {
  console.error("路由错误:", error);
  NProgress.done();
});

/**
 * 初始化用户信息和路由
 */
async function initializeUserAndRoutes() {
  console.log("开始初始化用户信息和路由...");
  
  // 1. 获取用户信息
  let role = store.getters.roles?.[0];
  if (!role) {
    console.log("获取用户信息...");
    const userInfo = await store.dispatch("user/getUserInfo");
    role = userInfo.role;
    console.log("用户信息获取成功，角色:", role);
  }

  // 2. 检查是否已有路由
  const existingRoutes = store.getters.permission_routes;
  if (existingRoutes && existingRoutes.length > 0) {
    console.log("路由已存在，跳过路由生成");
    return;
  }

  // 3. 确定目标平台
  const targetPlatform = await determinePlatform(role);
  console.log("确定目标平台:", targetPlatform);

  // 4. 生成和添加路由
  const accessRoutes = await store.dispatch("permission/generateRoutes", {
    role,
    platform: targetPlatform,
  });
  
  console.log("生成的权限路由数量:", accessRoutes?.length || 0);

  if (accessRoutes && accessRoutes.length > 0) {
    // 添加路由
    router.addRoutes(accessRoutes);
    console.log("动态路由添加完成");
    
    // 等待路由生效
    await new Promise(resolve => setTimeout(resolve, 100));
  } else {
    throw new Error("没有生成任何路由，用户可能无权限");
  }
}

/**
 * 确定用户应该使用的平台
 */
async function determinePlatform(role) {
  // 首先尝试从localStorage读取上次选择的平台
  const savedPlatform = localStorage.getItem("selectedPlatform");
  console.log("localStorage中保存的平台:", savedPlatform);

  // 获取用户可用平台列表
  const { getAvailablePlatforms, getDefaultPlatform } = require("@/utils/routeConfig");
  const availablePlatforms = getAvailablePlatforms(role);
  console.log("用户可用平台:", availablePlatforms);

  // 验证保存的平台是否有效
  if (savedPlatform && availablePlatforms.includes(savedPlatform)) {
    return savedPlatform;
  }

  // 使用默认平台
  return getDefaultPlatform(role);
}

/**
 * 获取重定向路径
 */
async function getRedirectPath() {
  // 获取当前平台信息
  const currentPlatform = store.getters["permission/currentPlatform"];
  console.log("当前平台:", currentPlatform);

  // 根据当前平台确定重定向路径
  if (currentPlatform === "console") {
    return "/console/dashboard";
  } else if (currentPlatform === "admin") {
    return "/admin/dashboard";
  }

  // 如果没有明确的平台信息，查找第一个可用路由
  const permissionRoutes = store.getters.permission_routes;
  if (permissionRoutes && permissionRoutes.length > 0) {
    const firstAccessiblePath = findFirstAccessibleRoute(permissionRoutes);
    if (firstAccessiblePath) {
      return firstAccessiblePath;
    }
  }

  // 默认返回401页面
  return "/401";
}

/**
 * 查找第一个可访问的路由
 */
function findFirstAccessibleRoute(routes) {
  for (const route of routes) {
    // 跳过隐藏的路由
    if (route.hidden) {
      continue;
    }

    // 如果路由有重定向，使用重定向路径
    if (route.redirect) {
      return route.redirect;
    }

    // 如果路由有子路由，查找第一个可访问的子路由
    if (route.children && route.children.length > 0) {
      for (const child of route.children) {
        if (!child.hidden) {
          // 构建完整路径
          const fullPath = route.path === "/" 
            ? child.path 
            : `${route.path}/${child.path}`.replace(/\/+/g, "/");
          return fullPath;
        }
      }
    }

    // 如果是直接可访问的路由
    if (route.component || route.path) {
      return route.path;
    }
  }

  return null;
}

/**
 * 处理认证错误
 */
async function handleAuthError(error, targetPath) {
  console.error("认证错误:", error);
  
  // 清理用户状态和路由
  await store.dispatch("user/resetToken");
  
  Message({
    message: error.message || "登录状态已过期，请重新登录",
    type: "warning",
    duration: 3000,
  });
}

/**
 * 重置路由状态 - 供外部调用
 */
export function resetRouteState() {
  console.log("路由状态已重置");
  // 这里不需要维护全局状态，因为我们通过store来管理路由状态
}