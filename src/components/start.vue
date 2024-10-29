<template>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <div style="width: auto; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 class="start-text">固定量的随机化</h1><br><br>
        <button @click="go_home()">开始游戏</button>
        <!-- 按钮的初始状态background color要加深（要往黑色靠） -->
    </div>
</template>

<script setup>
    import { onMounted } from 'vue';
    import { useRoute, useRouter } from 'vue-router'

    onMounted(() => {
        sessionStorage.setItem('homeAudioPlayed', 'false');
        sessionStorage.setItem('explainAudioPlayed', 'false');
    })

    const router = useRouter();
    const go_home = () => {
        router.push('/home');
    }
</script>