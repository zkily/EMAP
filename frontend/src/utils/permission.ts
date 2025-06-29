import { Directive } from 'vue';
import { useMainStore } from '../store/main';

export const vPermission: Directive = {
  mounted(el, binding) {
    const store = useMainStore();
    const { value } = binding;
    if (value) {
      const hasPermission = store.hasPermission(value);
      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    }
  }
};

export const vPermissionEnabled: Directive = {
  mounted(el, binding) {
    const store = useMainStore();
    const { value } = binding;
    if (value) {
      const hasPermission = store.hasPermission(value);
      if (!hasPermission) {
        el.disabled = true;
        el.classList.add('is-disabled');
      }
    }
  }
};
