import type { FormInstance, FormItemProp } from "element-plus";
import { clone } from "lodash-es";
import { ref } from "vue";

const isDisabled = ref(false);
const timer = ref<ReturnType<typeof setInterval> | undefined>(undefined);
const text = ref("");

export const useVerifyCode = () => {
  const start = async (
    formEl: FormInstance | undefined,
    props: FormItemProp,
    time = 60
  ) => {
    if (!formEl) return;
    const initTime = clone(time);
    await formEl.validateField(props, isValid => {
      if (isValid) {
        if (timer.value) clearInterval(timer.value);
        isDisabled.value = true;
        text.value = `${time}`;
        timer.value = setInterval(() => {
          if (time > 0) {
            time -= 1;
            text.value = `${time}`;
          } else {
            text.value = "";
            isDisabled.value = false;
            if (timer.value) clearInterval(timer.value);
            time = initTime;
          }
        }, 1000);
      }
    });
  };

  const end = () => {
    text.value = "";
    isDisabled.value = false;
    if (timer.value) clearInterval(timer.value);
  };

  return {
    isDisabled,
    timer,
    text,
    start,
    end
  };
};
