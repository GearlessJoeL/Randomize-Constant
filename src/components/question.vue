<template>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
    <div class="view-area">
        <div class="title">
            <h1>真假对称性</h1><br>
            <p>在一个圆周上，最右点叫做东端。取两个随机点将圆周断开成两段弧，包含东端的那段弧姑且叫做东半。</p>
            <p>请问东半的平均长度是否等于半个圆周? 可以点击模拟按键来寻找思路。</p>
        </div>
        <button id="mute-button" @click="toggleMute()">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
    </div>

</template>

<script setup>
    import {computed, onMounted, reactive, ref} from 'vue'
    import { useRoute, useRouter } from 'vue-router'

    const router = useRouter()
</script>
