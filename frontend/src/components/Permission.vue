<template>
  <component v-if="hasPermission" :is="tag">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '../store/main';
import { PropType } from 'vue';

const props = defineProps({
  permission: {
    type: [String, Array] as unknown as PropType<string | string[]>,
    required: true
  },
  tag: {
    type: String,
    default: 'div'
  }
});

const store = useMainStore();
const hasPermission = computed(() => store.hasPermission(props.permission as string | string[]));
</script>
