document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', handleClick);
    button.addEventListener('touchstart', handleClick, { passive: true });
});

document.addEventListener('focusin', () => {
    window.scrollTo(0, 0);
});