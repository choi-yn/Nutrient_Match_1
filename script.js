// 음식 데이터 정의
const foods = [
    { id: 'ramen', name: '라면', type: 'carbohydrate', image: 'images/라면.gif', sound: 'sounds/라면.mp3' },
    { id: 'potato', name: '감자', type: 'carbohydrate', image: 'images/감자.gif', sound: 'sounds/감자.mp3' },
    { id: 'rice', name: '쌀밥', type: 'carbohydrate', image: 'images/쌀밥.gif', sound: 'sounds/쌀밥.mp3' },
    { id: 'bread', name: '빵', type: 'carbohydrate', image: 'images/빵.gif', sound: 'sounds/빵.mp3' },
    { id: 'orange', name: '오렌지', type: 'vitamin', image: 'images/오렌지.gif', sound: 'sounds/오렌지.mp3' },
    { id: 'apple', name: '사과', type: 'vitamin', image: 'images/사과.gif', sound: 'sounds/사과.mp3' },
    { id: 'carrot', name: '당근', type: 'vitamin', image: 'images/당근.gif', sound: 'sounds/당근.mp3' },
    { id: 'mushroom', name: '버섯', type: 'vitamin', image: 'images/버섯.gif', sound: 'sounds/버섯.mp3' },
    { id: 'fish', name: '생선', type: 'protein', image: 'images/생선.gif', sound: 'sounds/생선.mp3' },
    { id: 'egg', name: '계란', type: 'protein', image: 'images/계란.gif', sound: 'sounds/계란.mp3' },
    { id: 'bean', name: '콩', type: 'protein', image: 'images/콩.gif', sound: 'sounds/콩.mp3' },
    { id: 'meat', name: '고기', type: 'protein', image: 'images/고기.gif', sound: 'sounds/고기.mp3' },
    { id: 'butter', name: '버터', type: 'fat', image: 'images/버터.gif', sound: 'sounds/버터.mp3' },
    { id: 'sugar', name: '설탕', type: 'fat', image: 'images/설탕.gif', sound: 'sounds/설탕.mp3' },
    { id: 'oil', name: '기름', type: 'fat', image: 'images/기름.gif', sound: 'sounds/기름.mp3' },
    { id: 'mayonnaise', name: '마요네즈', type: 'fat', image: 'images/마요네즈.gif', sound: 'sounds/마요네즈.mp3' },
    { id: 'milk', name: '우유', type: 'calcium', image: 'images/우유.gif', sound: 'sounds/우유.mp3' },
    { id: 'yogurt', name: '요거트', type: 'calcium', image: 'images/요거트.gif', sound: 'sounds/요거트.mp3' },
    { id: 'cheese', name: '치즈', type: 'calcium', image: 'images/치즈.gif', sound: 'sounds/치즈.mp3' },
    { id: 'anchovy', name: '멸치', type: 'calcium', image: 'images/멸치.gif', sound: 'sounds/멸치.mp3' }
];

const NUTRIENT_TYPES = ['carbohydrate', 'vitamin', 'protein', 'fat', 'calcium'];
const MOVE_THRESHOLD = 8;

let score = 0;
let dragGhost = null;
let activeDrag = null;
let audioContext = null;

function updateScore() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.textContent = score;
    }
}

function pickRandomFoodsOnePerCategory() {
    const selectedFoods = NUTRIENT_TYPES.map(type => {
        const categoryFoods = foods.filter(food => food.type === type);
        const index = Math.floor(Math.random() * categoryFoods.length);
        return categoryFoods[index];
    });

    return selectedFoods.sort(() => Math.random() - 0.5);
}

function playSound(src) {
    try {
        const sound = new Audio(src);
        sound.play().catch(() => {});
    } catch (error) {
        // 사운드 재생 실패는 게임 진행을 막지 않음
    }
}

function playPopSound() {
    try {
        if (!audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            audioContext = new AudioCtx();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(620, now);
        oscillator.frequency.linearRampToValueAtTime(180, now + 0.12);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.14);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    } catch (error) {
        // 소리 없이도 드래그는 계속 가능
    }
}

function safeReleasePointerCapture(element, pointerId) {
    if (!element || pointerId == null) return;

    try {
        if (element.hasPointerCapture && element.hasPointerCapture(pointerId)) {
            element.releasePointerCapture(pointerId);
        }
    } catch (error) {
        // 일부 브라우저/태블릿에서 포인터가 이미 끊긴 경우 무시
    }
}

function clearBowlHighlights() {
    document.querySelectorAll('.bowl-area.drag-over').forEach(bowl => {
        bowl.classList.remove('drag-over');
    });
}

function getBowlAtPoint(x, y) {
    if (dragGhost) {
        dragGhost.style.visibility = 'hidden';
    }

    const element = document.elementFromPoint(x, y);
    const bowl = element ? element.closest('.bowl-area') : null;

    if (dragGhost) {
        dragGhost.style.visibility = 'visible';
    }

    return bowl;
}

function highlightBowlAtPoint(x, y) {
    clearBowlHighlights();
    const bowl = getBowlAtPoint(x, y);
    if (bowl) {
        bowl.classList.add('drag-over');
    }
}

function createDragGhost(foodItem) {
    const rect = foodItem.getBoundingClientRect();
    const ghost = foodItem.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('drag-ghost');
    ghost.classList.remove('picked-up');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);

    requestAnimationFrame(() => {
        ghost.classList.add('drag-ghost-pop');
    });

    return ghost;
}

function moveDragGhost(clientX, clientY) {
    if (!dragGhost) return;

    const width = dragGhost.offsetWidth;
    const height = dragGhost.offsetHeight;
    dragGhost.style.left = `${clientX - width / 2}px`;
    dragGhost.style.top = `${clientY - height / 2}px`;
}

function removeDragGhost() {
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
}

function setPageScrollLocked(locked) {
    document.body.classList.toggle('dragging-active', locked);
}

function handleDrop(foodItem, clientX, clientY) {
    const bowl = getBowlAtPoint(clientX, clientY);
    if (!bowl) return;

    const bowlType = bowl.parentElement.dataset.type;
    const foodType = foodItem.dataset.type;

    if (bowlType === foodType) {
        playSound('sounds/Glow3.mp3');
        score += 1;
        updateScore();
        foodItem.classList.add('placed');
        foodItem.style.visibility = 'hidden';
    } else {
        playSound('sounds/Error3.mp3');
        score = Math.max(0, score - 1);
        updateScore();
    }
}

function onDocumentPointerMove(event) {
    if (!activeDrag) return;

    event.preventDefault();
    moveDragGhost(event.clientX, event.clientY);
    highlightBowlAtPoint(event.clientX, event.clientY);
}

function onDocumentPointerUp(event) {
    if (!activeDrag) return;

    const { foodItem, pointerId } = activeDrag;
    handleDrop(foodItem, event.clientX, event.clientY);
    endDrag(pointerId);
}

function endDrag(pointerId) {
    document.removeEventListener('pointermove', onDocumentPointerMove);
    document.removeEventListener('pointerup', onDocumentPointerUp);
    document.removeEventListener('pointercancel', onDocumentPointerUp);

    if (activeDrag) {
        activeDrag.foodItem.classList.remove('picked-up');
        safeReleasePointerCapture(activeDrag.foodItem, pointerId != null ? pointerId : activeDrag.pointerId);
        activeDrag = null;
    }

    removeDragGhost();
    clearBowlHighlights();
    setPageScrollLocked(false);
}

function startDrag(foodItem, pointerId, clientX, clientY) {
    if (foodItem.classList.contains('placed') || activeDrag) return;

    activeDrag = { foodItem, pointerId };
    foodItem.classList.add('picked-up');
    playPopSound();
    dragGhost = createDragGhost(foodItem);
    moveDragGhost(clientX, clientY);
    setPageScrollLocked(true);

    document.addEventListener('pointermove', onDocumentPointerMove, { passive: false });
    document.addEventListener('pointerup', onDocumentPointerUp);
    document.addEventListener('pointercancel', onDocumentPointerUp);
}

function setupFoodInteraction(foodItem, food) {
    let startX = 0;
    let startY = 0;
    let dragStarted = false;
    let activePointerId = null;

    foodItem.addEventListener('pointerdown', (event) => {
        if (foodItem.classList.contains('placed')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        dragStarted = false;
        activePointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;

        try {
            foodItem.setPointerCapture(event.pointerId);
        } catch (error) {
            // 포인터 캡처 실패 시에도 드래그는 시도
        }
    });

    foodItem.addEventListener('pointermove', (event) => {
        if (activeDrag || dragStarted || event.pointerId !== activePointerId) return;

        const movedX = Math.abs(event.clientX - startX);
        const movedY = Math.abs(event.clientY - startY);
        if (movedX > MOVE_THRESHOLD || movedY > MOVE_THRESHOLD) {
            dragStarted = true;
            startDrag(foodItem, event.pointerId, event.clientX, event.clientY);
        }
    });

    foodItem.addEventListener('pointerup', (event) => {
        if (event.pointerId !== activePointerId) return;

        if (activeDrag && activeDrag.foodItem === foodItem) {
            return;
        }

        if (!dragStarted) {
            playSound(food.sound);
        }

        safeReleasePointerCapture(foodItem, event.pointerId);
        activePointerId = null;
        dragStarted = false;
    });

    foodItem.addEventListener('pointercancel', (event) => {
        if (event.pointerId !== activePointerId) return;

        safeReleasePointerCapture(foodItem, event.pointerId);
        activePointerId = null;
        dragStarted = false;
    });
}

function createFoodItems() {
    const foodContainer = document.getElementById('foodContainer');
    if (!foodContainer) return;

    endDrag();
    foodContainer.innerHTML = '';

    const selectedFoods = pickRandomFoodsOnePerCategory();

    selectedFoods.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        foodItem.id = food.id;
        foodItem.dataset.type = food.type;
        foodItem.dataset.sound = food.sound;

        const img = document.createElement('img');
        img.src = food.image;
        img.alt = food.name;
        img.draggable = false;

        foodItem.appendChild(img);
        setupFoodInteraction(foodItem, food);
        foodContainer.appendChild(foodItem);
    });
}

function setupNutrientButtons() {
    document.querySelectorAll('.nutrient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nutrientType = btn.dataset.nutrient;
            let soundFile;

            switch (nutrientType) {
                case '비타민':
                    soundFile = 'sounds/비타민.mp3';
                    break;
                case '탄수화물':
                    soundFile = 'sounds/탄수화물.mp3';
                    break;
                case '단백질':
                    soundFile = 'sounds/단백질.mp3';
                    break;
                case '지방':
                    soundFile = 'sounds/지방.mp3';
                    break;
                case '칼슘':
                    soundFile = 'sounds/칼슘.mp3';
                    break;
            }

            if (soundFile) {
                playSound(soundFile);
            }
        });
    });
}

function initGame() {
    const restartBtn = document.getElementById('restartBtn');
    if (!restartBtn) return;

    setupNutrientButtons();

    restartBtn.addEventListener('click', () => {
        playSound('sounds/Glow3.mp3');
        score = 0;
        updateScore();
        createFoodItems();
    });

    createFoodItems();
}

document.addEventListener('DOMContentLoaded', initGame);

document.addEventListener('touchmove', (event) => {
    if (document.body.classList.contains('dragging-active')) {
        event.preventDefault();
    }
}, { passive: false });
