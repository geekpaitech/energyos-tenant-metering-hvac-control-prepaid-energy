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
    to.meta && to.meta.title ? `${to.meta.title} -  物联中台` : " 物联中台";

  const hasToken = getToken();

  if (hasToken) {
    if (to.path === "/login") {
      // 已登录用户访问登录页，重定向到首页
      const redirectPath = await getRedirectPath();
      next({ path: redirectPath, replace: true });
      NProgress.done();
      return;
    }

    // 检查是否有用户信息和路由
    const hasUserInfo =
      store.getters.name &&
      store.getters.roles &&
      store.getters.roles.length > 0;
    const hasRoutes =
      store.getters.permission_routes &&
      store.getters.permission_routes.length > 0;

    if (hasUserInfo && hasRoutes) {
      // 已有用户信息和路由，直接通过

      next();
    } else {
      try {
        // 获取用户信息（如果还没有）
        let role = store.getters.roles?.[0];
        if (!hasUserInfo) {
          const userInfo = await store.dispatch("user/getUserInfo");
          role = userInfo.role;
        }

        // 生成路由（如果还没有）
        if (!hasRoutes) {
          // 确定目标平台
          const targetPlatform = await determinePlatform(role);

          // 生成和添加路由
          const accessRoutes = await store.dispatch(
            "permission/generateRoutes",
            {
              role,
              platform: targetPlatform,
            }
          );

          if (accessRoutes && accessRoutes.length > 0) {
            // 添加路由
            router.addRoutes(accessRoutes);

            // 处理根路径重定向
            if (to.path === "/" || to.path === "") {
              const redirectPath = await getRedirectPath();
              next({ path: redirectPath, replace: true });
              return;
            }

            // 重新导航到目标路由，让新添加的路由生效

            next({ ...to, replace: true });
            return;
          } else {
            console.error("没有生成任何路由，跳转401");
            next({ path: "/401", replace: true });
            NProgress.done();
            return;
          }
        }

        // 如果用户信息和路由都已存在，直接通过
        next();
      } catch (error) {
        console.error("初始化失败:", error);
        await handleAuthError(error, to.path);
        next({
          path: "/login?redirect=" + encodeURIComponent(to.path),
          replace: true,
        });
        NProgress.done();
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else {
      next({
        path: "/login?redirect=" + encodeURIComponent(to.path),
        replace: true,
      });
      NProgress.done();
    }
  }
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
 * 确定用户应该使用的平台
 */
async function determinePlatform(role) {
  // 首先尝试从localStorage读取上次选择的平台
  const savedPlatform = localStorage.getItem("selectedPlatform");

  // 获取用户可用平台列表
  const {
    getAvailablePlatforms,
    getDefaultPlatform,
  } = require("@/utils/routeConfig");
  const availablePlatforms = getAvailablePlatforms(role);

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
          const fullPath =
            route.path === "/"
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
