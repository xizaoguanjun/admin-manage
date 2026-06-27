<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Motion from "../utils/motion";
import { useUserStoreHook } from "@/store/modules/user";

const { t } = useI18n();
</script>

<template>
  <Motion class="-mt-2 -mb-2">
    <div class="flex flex-col items-center justify-center p-8">
      <el-icon :size="80" color="#409eff">
        <component :is="'QrCode'" />
      </el-icon>
      <p class="mt-4 text-gray-500">{{ t("login.pureTest") }}</p>
      <p class="mt-2 text-sm text-gray-400">二维码登录功能需要对接后端实现</p>
    </div>
  </Motion>
  <Motion :delay="100">
    <el-divider>
      <p class="text-gray-500 text-xs">{{ t("login.pureTip") }}</p>
    </el-divider>
  </Motion>
  <Motion :delay="150">
    <el-button
      class="w-full mt-4!"
      @click="useUserStoreHook().SET_CURRENTPAGE(0)"
    >
      {{ t("login.pureBack") }}
    </el-button>
  </Motion>
</template>
