// ==UserScript==
// @name         智慧树网课视频爬虫
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动依次播放智慧树视频，采集信息并保存为JSON，带防检测模拟点击
// @match        *://studyvideoh5.zhihuishu.com/*
// @grant        none
// ==/UserScript==



(function() {
    'use strict';

    /********************
     * 配置区
     ********************/
    const SELECTOR_VIDEO_ITEMS = 'li.video'; // 视频列表项
    const SELECTOR_TITLE = '.catalogue_title';
    const SELECTOR_NUMBER = '.hour';
    const SELECTOR_DURATION = '.time';
    const SIMULATE_CLICK_DELAY = [1500, 3500]; // 模拟点击延迟范围（毫秒）

    let videoList = [];
    let currentIndex = 0;
    let collectedData = []; // 存储所有视频信息

    /********************
     * 工具函数
     ********************/
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function simulateClick(el) {
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        el.dispatchEvent(evt);
    }

    function getTimestamp() {
        return new Date().toISOString().replace(/[-:.TZ]/g, '');
    }

    async function fetchRealVideoUrl() {
        // 直接从 <video> 标签获取播放地址
        let videoEl = document.querySelector('video');
        return videoEl ? videoEl.src : '';
    }

    function saveToLocalJSON(dataArray) {
        const jsonStr = JSON.stringify(dataArray, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const filename = getTimestamp() + '.json';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /********************
     * 核心逻辑
     ********************/
    async function processVideo(index) {
        if (index >= videoList.length) {
            console.log('✅ 所有视频已处理完成，正在保存 JSON 文件...');
            saveToLocalJSON(collectedData);
            return;
        }

        const item = videoList[index];
        console.log(`▶ 正在处理第 ${index + 1} 个视频`);

        // 模拟点击
        await sleep(randomDelay(...SIMULATE_CLICK_DELAY));
        simulateClick(item);

        // // 等待视频加载
        // await sleep(3000);
        // 等待视频加载（最长 120 秒）
        let waited = 0;
        while (waited < 120000) { // 120000 毫秒 = 120 秒
            const videoEl = document.querySelector('video');
            if (videoEl && videoEl.readyState >= 2) { // HAVE_CURRENT_DATA
                break; // 视频已加载到可播放状态
            }
            await sleep(500); // 每 0.5 秒检查一次
            waited += 500;
        }


        // 获取信息
        const number = item.querySelector(SELECTOR_NUMBER)?.innerText.trim() || '';
        const title = item.querySelector(SELECTOR_TITLE)?.innerText.trim() || '';
        const duration = item.querySelector(SELECTOR_DURATION)?.innerText.trim() || '';
        const realUrl = await fetchRealVideoUrl();

        const infoObj = {
            number,
            title,
            duration,
            realUrl
        };
        console.log(infoObj);

        // 存入数组
        collectedData.push(infoObj);

        // 播放下一个
        processVideo(index + 1);
    }

    function initVideoList(startIndex = 0) {
        videoList = Array.from(document.querySelectorAll(SELECTOR_VIDEO_ITEMS));
        if (!videoList.length) {
            console.warn('⚠ 未找到视频列表，请检查选择器');
            return;
        }
        currentIndex = startIndex;
        collectedData = []; // 清空旧数据
        processVideo(currentIndex);
    }

    /********************
     * 添加触发按钮
     ********************/
    function addTriggerButton() {
        const btn = document.createElement('button');
        btn.innerText = '▶ 网课爬虫开始';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 9999,
            padding: '10px',
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
        });

        btn.addEventListener('click', () => {
            // 每次点击时重新获取列表
            videoList = Array.from(document.querySelectorAll(SELECTOR_VIDEO_ITEMS));

            // 尝试找到当前播放项（智慧树可能用 playing/on 标记）
            let currentItem = document.querySelector('li.video.playing')
                           || document.querySelector('li.video.on')
                           || videoList[0];

            const startIndex = videoList.indexOf(currentItem);
            console.log('▶ 从索引', startIndex, '开始播放');
            initVideoList(startIndex >= 0 ? startIndex : 0);
        });

        document.body.appendChild(btn);
    }

    /********************
     * 等待目录渲染完成再加按钮
     ********************/
    const observer = new MutationObserver(() => {
        if (document.querySelector(SELECTOR_VIDEO_ITEMS)) {
            addTriggerButton();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
