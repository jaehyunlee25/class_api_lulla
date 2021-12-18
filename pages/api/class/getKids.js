import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getKidsTotalNoSearch: 'getKidsTotalNoSearch',
  getKidsTotalSearch: 'getKidsTotalSearch',
  getKidsClassNoSearch: 'getKidsClassNoSearch',
  getKidsClassSearch: 'getKidsClassSearch',
};
const baseUrl = 'sqls/class/getKids'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = 0;
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.class.getKids.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.1'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2 userId와 memberId가 같은 멤버 조회
  EXEC_STEP = '3.2.1'; // #3.2.1 memberId 유효성 점검
  const { member_id: memberId, class_id: classId, search } = req.body;

  EXEC_STEP = '3.2'; // #3.2 member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');

  const { schoolId, grade } = qMember.message;

  if (grade > 3)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.class.getKids.3.2.3',
      message: '반의 원아 목록을 조회할 권한이 없습니다.',
    });

  let query;

  if (classId && search) query = QTS.getKidsClassSearch;
  else if (!classId && search) query = QTS.getKidsTotalSearch;
  else if (classId && !search) query = QTS.getKidsClassNoSearch;
  else if (!classId && !search) query = QTS.getKidsTotalNoSearch;

  const qMems = await query.fQuery(baseUrl, {
    schoolId,
    classId,
    search,
  });
  if (qMems.type === 'error')
    return qMems.onError(res, '3.1.2.1', 'searching member');

  const kids = qMems.message.rows;

  return RESPOND(res, {
    kids,
    message: '해당하는 원생 목록을 성공적으로 반환했습니다.',
    resultCode: 200,
  });
}
