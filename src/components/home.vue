<template>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
    
    <div class="view-area">
        <!-- <button v-if="!hasInteracted" @click="startPlayback">Click to Start audio1</button>
        <div v-else>
            <button @click="toggleMute">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
        </div> -->
        <div class="title">
            <h1>真假对称性</h1><br>
            <div v-if="!simulation_finished">
                <p>在一个圆周上，最右点叫做东端。取两个随机点将圆周断开成两段弧，包含东端的那段弧姑且叫做东半。</p>
                <p>请问东半的平均长度是否等于半个圆周? 可以点击模拟按键来寻找思路。</p>
            </div>
            <div v-if="simulation_finished">
                <p>看起来，东半的长度大于半个圆，请问具体平均长度为多少，以及为什么？</p>
                <p>可以点击模拟按键得到提示。</p>
            </div>
        </div>
        <button id="mute-button" @click="toggleMute()">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
        
        <div class="content-area">
            <div id="explain-button">
                <button @click="go_explain()">解释</button>
            </div>
            <div class="detail-area">
                <div class="chart-container">
                    <Chart type="bar" :data="chart_data" :options="chart_options" />
                    <!-- <Chart type="bar" :data="freq_data" :options="freq_chart_options" /> -->
                    
                    <!-- <p>Point A: {{ web.points[0] }} </p>
                    <p>Point B: {{ web.points[1] }} </p> -->
                </div>
                <div class="info-container">
                    <div class="canvas-container" v-show="false">
                        <canvas ref="background_canvas" id="background-canvas"></canvas>
                        <canvas ref="points_canvas" id="points-canvas" @mousemove="handle_mouse_move"></canvas>
                        <div v-if="hoverInfo.visible" :style="hoverInfo.style" class="info-box">
                            {{ hoverInfo.text }}
                        </div>
                    </div>
                    <!-- <div class="empty-space" v-if="!simulation_finished"></div> -->
                    
                    <div class="text-info">
                        <!-- <p>东段长度 = {{ web.arc_length.toFixed(2) }}</p> -->
                        <p>东半长度 = {{ web.proportion.toFixed(2) }} 个周长</p>
                        <p>东半平均 = {{ web.ave_propability.toFixed(2) }} 个周长</p>
                        <p>模拟次数: {{ web.count }}</p>
                        <!-- <span>输入模拟次数: </span><input v-model.number="web.sim_times"/> -->
                        <br>
                        <div id="simulate-button">
                            <button @click="fast_simulate(simulation_finished ? 100 : 10)">模拟{{simulation_finished ? 100 : 10}}次</button>
                        </div>
                        
                    </div>
                </div>
                
            </div>
            
            <footer class="bottom">
                <img class="qr-code" src="../assets/qrcode.png" alt="QR Code">
                <div class="bottom-text">
                    <p>制作：霍明熠</p>
                    <i>电子科技大学</i>
                </div>
                
            </footer>
        </div>
    </div>
</template>

<script setup>
    import {computed, onMounted, onUnmounted, reactive, ref} from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import {Bar} from 'vue-chartjs'
    import Chart from 'primevue/chart'
    // import {
    //     Chart as ChartJS,
    //     Title,
    //     Tooltip,
    //     Legend,
    //     BarElement,
    //     CategoryScale,
    //     LinearScale,
    //     //ChartData
    // } from 'chart.js'
    // ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

    const router = useRouter()
    const web = reactive({
        angles: [],
        points: [[], []],
        arc_length: NaN,
        proportion: NaN,
        ave_propability: NaN,
        count: 0,
        sim_times: 1,
    });
    const background_canvas = ref(null);
    const points_canvas = ref(null);
    const chart_canvas = ref(null);
    const hoverInfo = ref({
        visible: false,
        text: '',
        style: {
            left: '0px',
            top: '0px',
        },
    });
    // const prime_chart = ref();
    // const display_angles = ref([]);
    // const display_labels = ref([]);
    const chart_data = ref();
    const chart_options = ref();
    const freq_data = ref();
    const freq_chart_options = ref();
    const simulation_finished = ref(false);
    const isMuted = ref(false);
    const hasInteracted = ref(false);
    const show_chart = ref(false);
    const audio1_finished = ref(false);
    const audio1 = new Audio('home_title.mp3');
    const audio2 = new Audio('question_title.mp3');

    const diviation_x = 400;
    const diviation_y = 400;
    const display_radius = 200;
    const actual_x = [];
    const actual_y = [];
    const normal_size = 6;
    const large_size = 10;
    const is_hovered = Array(3).fill(false);
    const proportion_array = [];
    const frequency = Array(100).fill(0);
    const dpr = window.devicePixelRatio || 1;
    let highest_freq = 0;

    onMounted(() => {
        const width = 800;
        const height = 800;
        points_canvas.value.width = width * dpr;
        points_canvas.value.height = height * dpr;
        background_canvas.value.width = width * dpr;
        background_canvas.value.height = height * dpr;
        draw_circle();
        draw_east_point();
        chart_data.value = setBarChartData();
        chart_options.value = setChartOptions();
        freq_data.value = setFreqData();
        freq_chart_options.value = setFreqOptions();
        //audio1.addEventListener('ended', onAudioEnded);
        console.log(sessionStorage.getItem('homeAudioPlayed'));
        if (sessionStorage.getItem('homeAudioPlayed') === 'true') {
            hasInteracted.value = true;
        }
        startPlayback();
        //draw_chart();
    });

    // onUnmounted(() => {
    //     if (audio1) {
    //         audio1.removeEventListener('ended', onAudioEnded);
    //     }
    // });

    const go_explain = () => {
        router.push('/explain');
    }

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    const fast_simulate = async (time) => {
        for (let i = 0; i < time; i ++){
            await sleep(42);
            generate_points();
        }
        await sleep(1000);
        simulation_finished.value = true;
        await sleep(1000);
        if (time === 10) start_play_second();
    }

    const generate_points = () => {
        const angle1 = Math.random() * 2 * Math.PI;
        const angle2 = Math.random() * 2 * Math.PI;
        //smaller angle
        web.angles[0] = Math.min(angle1, angle2);
        web.points[0] = [Math.cos(web.angles[0]), Math.sin(web.angles[0])];
        //larger angle
        web.angles[1] = Math.max(angle1, angle2);
        web.points[1] = [Math.cos(web.angles[1]), Math.sin(web.angles[1])];

        actual_x[0] = web.points[0][0] * display_radius + diviation_x;
        actual_y[0] = -web.points[0][1] * display_radius + diviation_y;
        actual_x[1] = web.points[1][0] * display_radius + diviation_x;
        actual_y[1] = -web.points[1][1] * display_radius + diviation_y;
        
        web.count ++;
        calculate_length();
        draw_points();
        refresh_chart();
    }

    const calculate_length = () => {
        const angle = Math.PI * 2 - (web.angles[1] - web.angles[0]);
        web.arc_length = angle;
        web.proportion = angle / Math.PI / 2 * 100;
        frequency[Math.floor(web.proportion)] ++;
        highest_freq = Math.max(highest_freq, frequency[Math.floor(web.proportion)]);
        statistic(web.proportion);
    }

    const statistic = (p) => {
        proportion_array.push(p);
        web.ave_propability = proportion_array.reduce((acc, cur) => acc + cur, 0) / proportion_array.length;
    }

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
        draw_east_point();
        for (let i = 0; i < 2; i ++){
            const r = is_hovered[i] ? large_size : normal_size;
            ctx.beginPath();
            ctx.arc(actual_x[i] * dpr, actual_y[i] * dpr, r * dpr, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
        }
    }

    const draw_east_point = () => {
        actual_x[2] = display_radius + diviation_x;
        actual_y[2] = diviation_y;
        const ctx = points_canvas.value.getContext('2d');
        ctx.clearRect(0, 0, 800, 800);
        const r = is_hovered[2] ? large_size : normal_size;
        ctx.beginPath();
        ctx.arc(actual_x[2] * dpr, actual_y[2] * dpr, r * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF99';
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('东端', (actual_x[2] + 10) * dpr, actual_y[2] * dpr);
        ctx.stroke();
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
        if (closestPoint != null && closestPoint != 2 && is_hovered[closestPoint]){
            hoverInfo.value.visible = true;
            hoverInfo.value.text = (closestPoint === 0 ? 'Point A: ': 'Point B: ') + String(web.points[closestPoint][0].toFixed(2)) + ', ' + String(web.points[closestPoint][1].toFixed(2));
            hoverInfo.value.style.left = `${event.clientX + 10}px`;
            hoverInfo.value.style.top = `${event.clientY + 15}px`;
        } else {
            hoverInfo.value.visible = false;
        }
        
        draw_points();
    }

    // const draw_chart = () => {
    //     const ctx = chart_canvas.value.getContext('2d');
    //     const chart = new Chart(ctx, {
    //         type: 'bar',
    //         data: {
    //             labels: Array.from(chart_data.value.datasets[0].data, (info) => info ? info[0] : null),
    //             datasets: [
    //                 {
    //                     label: 'Most Recent 3 Proportions and Overall Proportion',
    //                     data: Array.from(chart_data.value.datasets[0].data, (info) => info ? info[1] : null),
    //                 }
    //             ]
    //         },
    //         options: {
    //             responsive: true,
    //             maintainAspectRatio: false
    //         },
    //     });
    // }

    //handle chart
    const setBarChartData = () => {
        return {
            labels: [],
            datasets: [{
                label: ['单次模拟东段比例'],
                data: [],
                backgroundColor: [
                'rgba(6, 182, 212, 0.2)',
                // 'rgba(6, 182, 212, 0.2)',
                // 'rgba(6, 182, 212, 0.2)',
                // 'rgba(51, 255, 153, 0.3)',
                ],
                borderColor: [
                'rgb(6, 182, 212)',
                // 'rgb(6, 182, 212)',
                // 'rgb(6, 182, 212)',
                // 'rgb(82, 211, 216)',
                ],
                borderWidth: 1,
            }],
        };
    }

    const setFreqData = () => {
        return {
            labels: Array(100).fill(0).map((_, index) => index),
            datasets: [{
                label: '东段比例频率直方图',
                data: [],
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: 'rgb(6, 182, 212)',
                borderWidth: 1,
            }],
        };
    }

    const setChartOptions = () => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--p-text-color');
        const textColorSecondary = documentStyle.getPropertyValue(
            '--p-text-muted-color'
        );
        const surfaceBorder = documentStyle.getPropertyValue(
            '--p-content-border-color'
        );

        return {
            plugins: {
            legend: {
                labels: {
                    color: textColor,
                },
            },
            },
            scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
            y: {
                beginAtZero: true,
                min: 0,
                max: 100,
                stepSize: 10,
                ticks: {
                    color: textColorSecondary,
                    reverse: false,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
            },
        };
    };

    const setFreqOptions = () => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--p-text-color');
        const textColorSecondary = documentStyle.getPropertyValue(
            '--p-text-muted-color'
        );
        const surfaceBorder = documentStyle.getPropertyValue(
            '--p-content-border-color'
        );

        return {
            plugins: {
            legend: {
                labels: {
                    color: textColor,
                },
            },
            },
            scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
            y: {
                beginAtZero: true,
                stepSize: Math.floor(highest_freq/10),
                ticks: {
                    color: textColorSecondary,
                    reverse: false,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
            },
        };
    }

    const refresh_chart = () => {
        const display_angles = [];
        const display_labels = [];
        // if (web.count > 3){
        //     for (let i = 3; i >= 1; i --){
        //         display_angles.push(proportion_array[web.count - i]);
        //         display_labels.push(web.count - i + 1);
        //     }
        // } else {
        //     proportion_array.forEach((element, index) => {
        //         display_angles.push(element);
        //         display_labels.push(index + 1);
        //     });
        // }
        
        proportion_array.forEach((element, index) => {
            display_angles.push(element);
            display_labels.push(index + 1);
        });
        // display_angles.push(web.ave_propability);
        // display_labels.push('总体比例');
        chart_data.value.datasets[0].data = display_angles;
        chart_data.value.labels = display_labels;
        freq_data.value.datasets[0].data = frequency.concat();
        console.log(frequency);
    }
    
    //handle audio1
    const toggleMute = () => {
        isMuted.value = !isMuted.value;
        audio1.muted = isMuted.value;
        audio2.muted = isMuted.value;
    };

    const startPlayback = () => {
        if (!hasInteracted.value) {
            audio1.play().then(() => {
                hasInteracted.value = true;
                sessionStorage.setItem('homeAudioPlayed', 'true');
                console.log('played');
            }).catch(error => {
                console.error("Playback failed:", error);
            });
        } else {
            console.log("not played");
        }
    };

    const onAudioEnded = () => {
        audio1_finished.value = true;
        console.log('on audio ended', audio1_finished.value);
        start_play_second();
    }

    const start_play_second = () => {
        audio2.play().then(() => {
            hasInteracted.value = true;
            sessionStorage.setItem('homeAudioPlayed', 'true');
            console.log('played');
        }).catch(error => {
            console.error("Playback failed:", error);
        });
        
    }
</script>

<style scoped>
</style>
