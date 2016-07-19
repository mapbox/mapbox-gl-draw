module.exports = {
  enable(ctx) {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.dragPan) return;
      ctx.map.dragPan.enable();
    }, 0);
  },
  disable(ctx) {
    ctx.map.dragPan.disable();
  }
};
