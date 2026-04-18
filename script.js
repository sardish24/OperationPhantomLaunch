document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        intro: document.getElementById('intro-screen'),
        recording: document.getElementById('recording-screen'),
        text: document.getElementById('text-screen'),
        post: document.getElementById('post-screen')
    };

    const btns = {
        startVoice: document.getElementById('start-voice-btn'),
        textMode: document.getElementById('text-mode-btn'),
        stopRecording: document.getElementById('stop-btn'),
        backToVoice: document.getElementById('back-to-voice'),
        destroyText: document.getElementById('destroy-text-btn'),
        returnHome: document.getElementById('return-home')
    };

    const visualizer = document.getElementById('visualizer');
    const textInput = document.getElementById('text-input');
    
    let audioContext, analyser, microphone;
    let animationId;
    let isRecording = false;

    function switchScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    }

    btns.startVoice.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            switchScreen('recording');
            startVisualizer(stream);
            isRecording = true;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Microphone access is required to use the voice protocol. Please allow permissions, or use the text mode.');
        }
    });

    btns.textMode.addEventListener('click', () => {
        switchScreen('text');
        textInput.focus();
    });

    btns.backToVoice.addEventListener('click', () => {
        switchScreen('intro');
    });

    const stopAndDestroy = () => {
        if (isRecording) {
            stopVisualizer();
            isRecording = false;
        }
        textInput.value = ''; // Burn text
        switchScreen('post');
    };

    btns.stopRecording.addEventListener('click', stopAndDestroy);
    btns.destroyText.addEventListener('click', stopAndDestroy);

    btns.returnHome.addEventListener('click', () => {
        switchScreen('intro');
    });

    function startVisualizer(stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 64;
        
        microphone.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        visualizer.innerHTML = '';
        const numBars = 15;
        for (let i = 0; i < numBars; i++) {
            const bar = document.createElement('div');
            bar.classList.add('bar');
            visualizer.appendChild(bar);
        }
        
        const bars = document.querySelectorAll('.bar');

        function renderFrame() {
            animationId = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);
            
            for (let i = 0; i < numBars; i++) {
                const dataIndex = Math.floor(i * (bufferLength / numBars));
                let value = dataArray[dataIndex];
                
                if (value < 5) value = 5 + Math.random() * 5; 
                
                const height = (value / 255) * 80;
                bars[i].style.height = `${Math.max(5, height)}px`;
                
                if(height > 50) {
                     bars[i].style.boxShadow = '0 0 10px var(--accent)';
                     bars[i].style.backgroundColor = '#ffcc00';
                } else {
                     bars[i].style.boxShadow = 'none';
                     bars[i].style.backgroundColor = 'var(--accent)';
                }
            }
        }
        
        renderFrame();
    }

    function stopVisualizer() {
        if (animationId) cancelAnimationFrame(animationId);
        if (microphone && microphone.mediaStream) {
            microphone.mediaStream.getTracks().forEach(t => t.stop());
        }
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }
        visualizer.innerHTML = '';
    }
});
