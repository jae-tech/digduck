import { PlaywrightActionRecorder } from "./utils/playwright-action-recorder";
import * as path from "path";

/**
 * 네이버 로그인 플로우를 상세 기록하는 스크립트
 *
 * 사용법:
 * 1. 이 스크립트 실행
 * 2. 브라우저가 열리면 수동으로 로그인 수행
 * 3. 완료 후 터미널에서 Ctrl+C 또는 브라우저 종료
 *
 * 기록되는 정보:
 * - 모든 클릭, 타이핑, 스크롤, 키보드 이벤트
 * - 각 액션의 정확한 타이밍과 지속시간
 * - 요소 정보와 선택자
 * - 페이지 성능 메트릭
 * - 상세 분석 리포트와 타임라인 CSV
 */
async function recordDetailedNaverLoginFlow() {
  console.log("🎬 네이버 로그인 플로우 상세 기록 시작");
  console.log("브라우저가 열리면 자연스럽게 로그인을 수행하세요.");
  console.log("모든 동작이 정밀하게 기록됩니다.\n");

  const recordingsPath = path.join(
    process.cwd(),
    "detailed-recordings",
    "naver-login"
  );
  const recorder = new PlaywrightActionRecorder(recordingsPath);

  let recordingFile: string;

  try {
    // 네이버 메인 페이지에서 상세 기록 시작
    const page = await recorder.startDetailedRecording("https://www.naver.com");

    console.log("\n📋 상세 기록 중인 브라우저 창에서:");
    console.log("1. 페이지를 자연스럽게 둘러보세요");
    console.log("2. 로그인 버튼을 찾아 클릭하세요");
    console.log("3. 아이디를 천천히 입력하세요");
    console.log("4. Tab 또는 클릭으로 비밀번호 필드 이동");
    console.log("5. 비밀번호를 입력하세요");
    console.log("6. Enter 키 또는 로그인 버튼으로 로그인");
    console.log("7. 로그인 완료까지 기다리세요");

    console.log("\n🔍 기록되는 정보:");
    console.log("- 마우스 움직임과 클릭 위치");
    console.log("- 타이핑 속도와 패턴");
    console.log("- 페이지 간 대기시간");
    console.log("- 요소별 상호작용 시간");
    console.log("- 스크롤과 키보드 이벤트");

    console.log("\n완료되면 이 터미널에서 Ctrl+C를 눌러주세요.");

    // Ctrl+C 핸들러
    process.on("SIGINT", async () => {
      console.log("\n🛑 상세 기록 중지 및 분석 중...");
      recordingFile = await recorder.stopDetailedRecording();

      console.log("\n✅ 상세 기록 완료!");
      console.log(`📁 기록 파일들이 저장되었습니다: ${recordingsPath}`);

      // 기록된 파일 목록 표시
      const recordings = recorder.getSavedRecordings();
      if (recordings.length > 0) {
        console.log("\n📊 생성된 파일들:");
        console.log("- 세션 데이터 (JSON)");
        console.log("- 분석 리포트 (JSON)");
        console.log("- 타임라인 CSV");
        console.log("- 비디오 녹화 (MP4)");

        console.log("\n💡 분석 리포트를 확인해보세요:");
        console.log(`   ${recordingsPath}/[sessionId]_analysis.json`);
      }

      setTimeout(() => {
        console.log("프로그램을 종료합니다.");
        process.exit(0);
      }, 3000);
    });

    // 무한 대기 (사용자가 Ctrl+C 할 때까지)
    await new Promise(() => {});
  } catch (error) {
    console.error("❌ 상세 기록 중 오류:", error);
    process.exit(1);
  }
}

/**
 * 저장된 상세 기록들을 분석하는 함수
 */
async function analyzeRecordings() {
  const recordingsPath = path.join(
    process.cwd(),
    "detailed-recordings",
    "naver-login"
  );
  const recorder = new PlaywrightActionRecorder(recordingsPath);

  const recordings = recorder.getSavedRecordings();

  if (recordings.length === 0) {
    console.log("❌ 분석할 기록이 없습니다.");
    return;
  }

  console.log(`📊 총 ${recordings.length}개의 기록을 발견했습니다.\n`);

  for (let i = 0; i < recordings.length; i++) {
    const recordingPath = recordings[i];
    const sessionData = JSON.parse(
      require("fs").readFileSync(recordingPath, "utf8")
    );

    console.log(`🔍 세션 ${i + 1}: ${sessionData.sessionId}`);
    console.log(
      `   - 총 지속시간: ${(sessionData.totalDuration / 1000).toFixed(2)}초`
    );
    console.log(`   - 총 액션 수: ${sessionData.statistics.totalActions}개`);
    console.log(`   - 클릭: ${sessionData.statistics.clickCount}회`);
    console.log(`   - 타이핑: ${sessionData.statistics.typeCount}회`);
    console.log(`   - 네비게이션: ${sessionData.statistics.navigationCount}회`);
    console.log(
      `   - 평균 액션 시간: ${sessionData.statistics.averageActionDuration.toFixed(2)}ms`
    );

    // 분석 리포트 파일 확인
    const analysisPath = recordingPath.replace(
      "_detailed.json",
      "_analysis.json"
    );
    if (require("fs").existsSync(analysisPath)) {
      console.log(`   📋 분석 리포트: ${analysisPath}`);
    }

    // CSV 타임라인 확인
    const csvPath = recordingPath.replace("_detailed.json", "_timeline.csv");
    if (require("fs").existsSync(csvPath)) {
      console.log(`   📈 타임라인 CSV: ${csvPath}`);
    }

    console.log("");
  }
}

/**
 * 가장 최근 기록에서 로그인 패턴을 추출하는 함수
 */
async function extractLoginPattern() {
  const recordingsPath = path.join(
    process.cwd(),
    "detailed-recordings",
    "naver-login"
  );
  const recorder = new PlaywrightActionRecorder(recordingsPath);

  const recordings = recorder.getSavedRecordings();

  if (recordings.length === 0) {
    console.log("❌ 추출할 기록이 없습니다.");
    return;
  }

  // 가장 최근 기록 사용
  const latestRecording = recordings[recordings.length - 1];
  const sessionData = JSON.parse(
    require("fs").readFileSync(latestRecording, "utf8")
  );

  console.log(`🔍 로그인 패턴 추출: ${sessionData.sessionId}\n`);

  // 로그인 관련 액션만 필터링
  const loginActions = sessionData.actions.filter((action: any) => {
    if (action.type === "navigate") return true;
    if (action.type === "click" && action.selector?.includes("login"))
      return true;
    if (
      action.type === "type" &&
      (action.selector?.includes("id") ||
        action.selector?.includes("password") ||
        action.selector?.includes("pw"))
    )
      return true;
    if (
      action.type === "keypress" &&
      (action.keyCode === "Enter" || action.keyCode === "Tab")
    )
      return true;
    return false;
  });

  console.log("🎯 추출된 로그인 패턴:");
  loginActions.forEach((action: any, index: number) => {
    const relativeTime = (
      (action.startTime - sessionData.startTime) /
      1000
    ).toFixed(2);

    switch (action.type) {
      case "navigate":
        console.log(
          `${index + 1}. [${relativeTime}s] 페이지 이동: ${action.url}`
        );
        break;
      case "click":
        console.log(
          `${index + 1}. [${relativeTime}s] 클릭: ${action.selector} (${action.duration}ms)`
        );
        break;
      case "type":
        const displayText = action.text?.includes("password")
          ? "****"
          : action.text?.substring(0, 10) + "...";
        console.log(
          `${index + 1}. [${relativeTime}s] 타이핑: ${displayText} (${action.duration}ms)`
        );
        break;
      case "keypress":
        console.log(
          `${index + 1}. [${relativeTime}s] 키 입력: ${action.keyCode}`
        );
        break;
    }
  });

  // 타이밍 분석
  console.log("\n⏱️ 타이밍 분석:");
  const typingActions = loginActions.filter((a: any) => a.type === "type");
  if (typingActions.length > 0) {
    const avgTypingSpeed =
      typingActions.reduce(
        (sum: number, action: any) => sum + action.duration,
        0
      ) / typingActions.length;
    console.log(`- 평균 타이핑 속도: ${avgTypingSpeed.toFixed(2)}ms per input`);
  }

  const clickActions = loginActions.filter((a: any) => a.type === "click");
  if (clickActions.length > 0) {
    const avgClickDuration =
      clickActions.reduce(
        (sum: number, action: any) => sum + action.duration,
        0
      ) / clickActions.length;
    console.log(`- 평균 클릭 지속시간: ${avgClickDuration.toFixed(2)}ms`);
  }

  // 대기시간 분석
  const waitTimes = [];
  for (let i = 1; i < loginActions.length; i++) {
    const waitTime = loginActions[i].startTime - loginActions[i - 1].endTime;
    if (waitTime > 0) {
      waitTimes.push(waitTime);
    }
  }

  if (waitTimes.length > 0) {
    const avgWaitTime =
      waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
    console.log(`- 평균 액션 간 대기시간: ${avgWaitTime.toFixed(2)}ms`);
  }
}

// CLI 실행
if (require.main === module) {
  const action = process.argv[2];

  switch (action) {
    case "analyze":
      analyzeRecordings().catch(console.error);
      break;
    case "pattern":
      extractLoginPattern().catch(console.error);
      break;
    case "record":
    default:
      recordDetailedNaverLoginFlow().catch(console.error);
      break;
  }
}

export { recordDetailedNaverLoginFlow, analyzeRecordings, extractLoginPattern };
