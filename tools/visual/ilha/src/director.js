/* Film director: plays the whole journey with simulated taps (deterministic, driven by the frame clock). */
window.director = async function (N) {
  const until = async f => { while (!f()) await N.wait(50); };
  const idle = () => until(() => !N.state().busy);
  const tapXY = async (x, y) => { N.touch(x, y); await N.wait(200); };
  const tapEl = async sel => { const [x, y] = N.rectOf(sel); await tapXY(x, y); };
  N.start("full");
  await until(() => N.state().scene === "island"); await N.wait(1400);
  // explore: a place under construction, a future place, then the lighthouse
  await tapXY(...N.screenOf("letras")); await N.focusPlace("letras"); await N.wait(700);
  await tapXY(...N.screenOf("numeros")); await N.focusPlace("numeros"); await N.wait(600);
  await tapXY(...N.screenOf("farol")); await N.focusPlace("farol"); await N.wait(700);
  await tapEl("#cardBtn"); await N.enterFarol(); await N.wait(700);
  await tapXY(...N.stopScreen(1)); await N.startActivity(); await N.wait(700);
  await tapEl('.ans[data-id="bird"]'); await N.answer("bird"); await N.wait(600);
  await tapEl('.ans[data-id="bear"]'); await N.answer("bear"); await N.wait(900);
  await tapEl("#sheetBtn"); await N.reward(); await N.wait(1000);
  await tapEl("#rewardBtn"); await N.backOutside(); await N.wait(1600);
  // the routine set by the parents brings the night
  await tapEl("#bParents"); N.openParents(true); await N.wait(1500);
  await tapEl('[data-pset="amb:rotina"]'); N.pressSeg('[data-pset="amb:rotina"]'); await N.wait(1100);
  await tapEl("#parentsClose"); N.openParents(false); await N.wait(400);
  await N.bedtime(); await N.wait(3000);
  window.__dirDone = true;
};
