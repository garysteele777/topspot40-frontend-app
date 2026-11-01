// @ts-nocheck -- runtime tests using Node test harness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);
const {normalizeNarrationPreferences, readNarrationPreferences, NARRATION_STORAGE_KEY} = await import('../src/lib/narrationPreferences.ts');
const {createCarModeNarration} = await import('../src/lib/carmode/CarModeNarration.ts');

test('Details selection enables details even after an intro-only legacy preset', () => {
    assert.deepEqual(normalizeNarrationPreferences({voices:['intro'],detailLength:'long',spotlightBioLength:'off'}), {voices:['intro','detail'],detailLength:'long',spotlightBioLength:'off'});
    assert.deepEqual(normalizeNarrationPreferences({voices:['intro','detail','artist'],detailLength:'off'}).voices,['intro','artist']);
});
test('saved narration choices survive reopening; Spotlight biography is independent', () => {
    const saved={voices:['artist'], detailLength:'off', spotlightBioLength:'long'};
    const storage={getItem:key=>key===NARRATION_STORAGE_KEY?JSON.stringify(saved):null};
    assert.deepEqual(readNarrationPreferences(storage),saved);
    assert.equal(readNarrationPreferences({getItem:()=>'{bad json'}).detailLength,'short');
    assert.equal(readNarrationPreferences({getItem:key=>key==='topspot_detail_length'?'long':null}).detailLength,'long');
});
function harness(result) {
    let resolve;
    const done=new Promise(r=>resolve=r);
    let completed=0;
    const track={rank:1, rankingId:1,spotifyTrackId:'a'};
    const narration=createCarModeNarration({getCurrentTrack:()=>track,getNarrations:()=>[{phase:'artist',url:'bio'}],getBedUrl:()=>'',unlockBed:async()=>{},startBed:async()=>{},stopBed(){},resetBed(){},playNarration:()=>done,stopNarration(){},updateTiming(){},resetTiming(){},getPlaybackPhase:()=> 'artist',setPlaybackPhase(){},setIsPlaying(){},resetGuidedReadyState(){},setGuidedReady(){},onNarrationComplete(){completed++}});
    return {narration,finish:()=>resolve(result),count:()=>completed,track};
}
test('biography counts only on completion, and cancellation does not consume it', async()=>{
    const good=harness(true);const running=good.narration.start(good.track);
    assert.equal(good.count(),0);good.finish();await running;assert.equal(good.count(),1);
    const failed=harness(false);const failedRun=failed.narration.start(failed.track);failed.finish();await failedRun;assert.equal(failed.count(),0);
    const paused=harness(true);const pausedRun=paused.narration.start(paused.track);paused.narration.pause();paused.finish();await pausedRun;assert.equal(paused.count(),0);
});
test('store persists shared switches and keeps Spotlight choice when legacy settings are saved', async()=>{
    const values=new Map([['topspot_playback_order','down'],['topspot_skip_played','false']]);globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
    const {playbackSettingsStore:store}=await import('../src/lib/stores/playbackSettings.store.ts');
    let current;const unsub=store.subscribe(value=>current=value);
    assert.equal(current.playbackOrder,'down');
    assert.equal(current.skipPlayed,false);
    store.update(value=>({...value,voices:['artist'],detailLength:'long',spotlightBioLength:'off'}));
    assert.deepEqual(current.voices,['detail','artist']);
    const {spotlightBioLength,...legacy}=current;store.set(legacy);
    assert.equal(current.spotlightBioLength,'off');
    assert.equal(values.get('topspot_playback_order'),'down');
    assert.equal(values.get('topspot_skip_played'),'false');
    assert.equal(JSON.parse(values.get(NARRATION_STORAGE_KEY)).spotlightBioLength,'off');
    unsub();
});
