<template>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <div class="view-area">
        <audio autoplay @ended="audio1_ended" ref="audio1" src="/explain1.wav"></audio>
        <!-- <audio @play="explain1_finished" ref="audio2"></audio> -->
        <div class="title">
            <h1>固定量的随机化</h1><br>
            <div v-if="!explain1_finished">在圆上取三个随机点 A, B, C。它们将圆切成三段弧，取名为AB弧，BC弧，和AC弧。基于随机对称性，每一段弧的平均长度都是 1/3 个圆周。</div>
            <div v-else>将 A, B, C 一齐旋转, 直至 A 点到达东端，在 B 和 C 旋转之后的位置将圆断开。结果的东半就是旋转之后的 AB 弧加上 AC 弧。所以答案是 2/3.</div>
            <!-- 一行话读完之后，再显示另一行 把点改成短线 要筛选掉太接近的点-->
            <!--手机适配？-->
        </div>
        <button id="mute-button" @click="toggleMute()">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
        <div class="explain-content-area">
            
            <div id="explain-button">
                <button @click="go_home()">返回</button>
            </div>
            <div class="explain-canvas-container">
                <canvas ref="background_canvas" id="background-canvas"></canvas>
                <canvas ref="points_canvas" id="points-canvas" @mousemove="handle_mouse_move"></canvas>
                <!-- <div v-if="hoverInfo.visible" :style="hoverInfo.style" class="info-box">
                    {{ hoverInfo.text }}
                </div> -->
            </div>
            <div class="explain-text-info">
                <!-- <p>Point A: {{ web.points[0] }} </p>
                <p>Point B: {{ web.points[1] }} </p>
                <p>Point C: {{ web.points[2] }} </p> -->
                <!-- <p>东半弧长: {{ web.arc_length.toFixed(2) }}</p> -->
                <!-- <p>东半长度: {{ web.proportion.toFixed(2) }}%</p><br> -->
                <button @click="simulate">模拟</button>
                <!-- <button @click="animate()">解释统计</button> -->
                <br>
            </div>
            
        </div>
        <div class="explain-bottom">
            <img class="qr-code" src="../assets/qrcode.png" alt="QR Code">
            <div class="bottom-text">
                <p>制作：霍明熠</p>
                <i>电子科技大学</i>
            </div>
        </div>
    </div>
</template>

<script setup>
    import {onMounted, reactive, ref} from 'vue'
    import { useRoute, useRouter } from 'vue-router'

    const router = useRouter();
    const web = reactive({
        angles: [],
        points: [[], []],
        arc_length: NaN,
        proportion: NaN
    });

    const background_canvas = ref(null);
    const points_canvas = ref(null);
    const hoverInfo = ref({
        visible: false,
        text: '',
        style: {
            left: '0px',
            top: '0px',
        },
    });
    const isMuted = ref(false);
    const hasInteracted = ref(false);
    const explain1_finished = ref(false);
    const explain2_finished = ref(false);
    const audio1 = ref(null);
    const audio2 = new Audio('explain2.wav');

    const diviation_x = 400;
    const diviation_y = 400;
    const display_radius = 200;
    const actual_x = [];
    const actual_y = [];
    const velocity = 0.0012;
    const normal_size = 12;
    const large_size = 16;
    const is_hovered = Array(3).fill(false);
    const dpr = window.devicePixelRatio || 1;
    const colors = ['rgb(255, 34, 34)', 'rgb(34, 255, 34)', 'rgb(34, 34, 255)'];
    let animationFrameId = null;

    onMounted(() => {
        const width = 800;
        const height = 800;
        points_canvas.value.width = width * dpr;
        points_canvas.value.height = height * dpr;
        background_canvas.value.width = width * dpr;
        background_canvas.value.height = height * dpr;
        //draw_circle();
        generate_points();
        if (sessionStorage.getItem('explainAudioPlayed') === 'true') {
            hasInteracted.value = true;
        }
        highlight_points();
        // startPlayback();
    });

    const go_home = () => {
        router.push('/');
    }
    
    const sleep = (delay) => new Promise((resolve) => {
        setTimeout(resolve, delay);
        console.log("sleep: ", delay);
    });

    const generate_points = () => {
        // const angle1 = Math.random() / 3 * Math.PI + Math.PI / 2;
        // const angle2 = (Math.random() + 1) * 2 / 5 * Math.PI + Math.PI * 2 / 3;
        // const angle3 = (Math.random() + 2) * 2 / 5 * Math.PI + Math.PI * 2 / 3;
        const angle1 = Math.PI / 4;
        const angle2 = Math.PI * 11 / 12;
        const angle3 = Math.PI * 19 / 12;

        web.angles = [angle1, angle2, angle3];
        web.angles.sort((a, b) => a - b);
        
        web.points[0] = [Math.cos(web.angles[0]), Math.sin(web.angles[0])];
        web.points[1] = [Math.cos(web.angles[1]), Math.sin(web.angles[1])];
        web.points[2] = [Math.cos(web.angles[2]), Math.sin(web.angles[2])];

        actual_x[0] = web.points[0][0] * display_radius + diviation_x;
        actual_y[0] = -web.points[0][1] * display_radius + diviation_y;
        actual_x[1] = web.points[1][0] * display_radius + diviation_x;
        actual_y[1] = -web.points[1][1] * display_radius + diviation_y;
        actual_x[2] = web.points[2][0] * display_radius + diviation_x;
        actual_y[2] = -web.points[2][1] * display_radius + diviation_y;
        
        //web.count ++;
        calculate_length();
        draw_points();
        draw_arcs();
    }

    const simulate = async() => {
        generate_points();
        await sleep(3000);
        animate();
    }

    const calculate_length = () => {
        const angle = Math.PI * 2 - (web.angles[1] - web.angles[0]);
        web.arc_length = angle;
        web.proportion = angle / Math.PI / 2 * 100;
        //statistic(web.proportion);
    }

    // const statistic = (p) => {
    //     proportion_array.push(p);
    //     web.ave_propability = proportion_array.reduce((acc, cur) => acc + cur, 0) / proportion_array.length;
    // }

    const draw_circle = () => {
        const ctx = background_canvas.value.getContext('2d');
        ctx.clearRect(0, 0, 800, 800);
        
        ctx.scale(dpr, dpr);
        ctx.beginPath();
        ctx.arc(diviation_x, diviation_y, display_radius, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    const draw_points = () => {
        const ctx = points_canvas.value.getContext('2d');
        ctx.clearRect(0, 0, 800, 800);
        //draw_east_point();
        for (let i = 0; i < 3; i ++){
            const r = is_hovered[i] ? large_size : normal_size;
            ctx.beginPath();
            ctx.arc(actual_x[i] * dpr, actual_y[i] * dpr, r * dpr, 0, 2 * Math.PI);
            ctx.strokeStyle = '#00CFFF';
            ctx.lineWidth = 4;
            ctx.stroke();
            if (i === 1 && web.angles[1] === 0) ctx.fillStyle = '#B3EFFF';
            else ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            if (i === 1 && web.angles[1] === 0) ctx.fillStyle = '#1C304A';
            else ctx.fillStyle = '#046B99';
            ctx.font = '20px Consolas';
            ctx.fillText(i === 1 ? 'A' : (i === 2 ? 'B' : 'C'), (actual_x[i] - 4.5) * dpr, (actual_y[i] + 4.8) * dpr);
        }
    }

    const draw_arcs = () => {
        const ctx = background_canvas.value.getContext('2d');
        for (let i = 0; i < 3; i ++){
            ctx.beginPath();
            ctx.arc(diviation_x * dpr, diviation_y * dpr, display_radius * dpr, -web.angles[i === 2 ? 0 : i + 1], -web.angles[i]);
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 3;
            // console.log(i, colors[i]);
            ctx.stroke();
        }

    }

    const draw_outlines = () => {
        const ctx = background_canvas.value.getContext('2d');
        for (let i = 0; i < 2; i ++){
            ctx.beginPath();
            ctx.arc(diviation_x * dpr, diviation_y * dpr, (display_radius + 3.5)* dpr, -web.angles[i === 2 ? 0 : i + 1], -web.angles[i]);
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 5;
            // console.log(i, colors[i]);
            ctx.stroke();
        }
    }

    // const draw_east_point = () => {
    //     actual_x[2] = display_radius + diviation_x;
    //     actual_y[2] = diviation_y;
    //     const ctx = points_canvas.value.getContext('2d');
    //     ctx.clearRect(0, 0, 800, 800);
    //     const r = is_hovered[2] ? large_size : normal_size;
    //     ctx.beginPath();
    //     ctx.arc(actual_x[2] * dpr, actual_y[2] * dpr, r * dpr, 0, 2 * Math.PI);
    //     ctx.fillStyle = 'red';
    //     ctx.fill();
    //     ctx.fillStyle = 'black';
    //     ctx.font = '16px Arial';
    //     ctx.fillText('East Point', (actual_x[2] + 10) * dpr, actual_y[2] * dpr);
    //     ctx.stroke();
    // }

    const animate = () => {
        const ctx = points_canvas.value.getContext('2d');
        ctx.clearRect(0, 0, 800, 800);
        let is_cancel = false;
        if (web.angles[1] <= 0.01){
            for (let i = 1; i < 3; i ++){
                web.angles[i] -= web.angles[1];
                web.points[i] = [Math.cos(web.angles[i]), Math.sin(web.angles[i])];
                actual_x[i] = web.points[i][0] * display_radius + diviation_x;
                actual_y[i] = -web.points[i][1] * display_radius + diviation_y;
            }
            web.angles[1] = 0;
            actual_x[1] = display_radius + diviation_x;
            actual_y[1] = diviation_y;
            draw_outlines();
            is_cancel = true;
        } else {
            for (let i = 0; i < 3; i ++){
                web.angles[i] -= velocity;
                web.points[i] = [Math.cos(web.angles[i]), Math.sin(web.angles[i])];
                actual_x[i] = web.points[i][0] * display_radius + diviation_x;
                actual_y[i] = -web.points[i][1] * display_radius + diviation_y;
            }
        }
        draw_arcs();
        draw_points();
        animationFrameId = requestAnimationFrame(animate);
        if (is_cancel) cancelAnimationFrame(animationFrameId);
    }

    const handle_mouse_move = (event) => {
        const rect = points_canvas.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let closestPoint = null;
        let minDistance = Infinity;
        let distance = Infinity;
        for (let i = 0; i < 3; i ++){
            distance = Math.sqrt((x - actual_x[i]) ** 2 + (y - actual_y[i]) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = i;
            }
        }
        is_hovered[closestPoint] = minDistance < normal_size;
        if (closestPoint != null && is_hovered[closestPoint]){
            hoverInfo.value.visible = true;
            hoverInfo.value.text = "Point ";
            if (closestPoint === 0) {
                hoverInfo.value.text += 'A';
            } else if (closestPoint === 1) {
                hoverInfo.value.text += 'B';
            } else {
                hoverInfo.value.text += 'C';
            }
            hoverInfo.value.text += ": " + String(web.points[closestPoint][0].toFixed(2)) + ', ' + String(web.points[closestPoint][1].toFixed(2));
            hoverInfo.value.style.left = `${event.clientX + 10}px`;
            hoverInfo.value.style.top = `${event.clientY + 15}px`;
        } else {
            hoverInfo.value.visible = false;
        }
        
        // draw_arcs();
        draw_points();
    }

    const toggleMute = () => {
        isMuted.value = !isMuted.value;
        audio1.muted = isMuted.value;
        audio2.muted = isMuted.value;
    };

    const startPlayback = () => {
        if (!hasInteracted.value) {
            audio1.play().then(() => {
                hasInteracted.value = true;
                sessionStorage.setItem('explainAudioPlayed', 'true');
                console.log('audio1 played');
            }).catch(error => {
                console.error("Playback1 failed:", error);
            });
            // explain1_finished.value = true;
            // // .then(() => {
            // audio2.play().then(() => {
            //     console.log("audio2 played");
            // }).catch(error => {
            //     console.error("Playback2 failed: ", error);
            // });
            // // })
        } else {
            console.log("not played");
        }
    };

    const audio1_ended = () => {
        explain1_finished.value = true;
        console.log("audio1 ended", explain1_finished.value);
        audio2.play();
        animate();
    }

    const highlight_points = () => {
        // TODO:
    }
</script>

<style scoped>
</style>
