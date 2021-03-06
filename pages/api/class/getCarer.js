import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getCarer: 'getCarer',
  getFamily: 'getFamily',
};
const baseUrl = 'sqls/class/getCarer'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.class.getCarer.3',
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
  const { member_id: memberId, class_id: classId, kid_id: kidId } = req.body;

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
      id: 'ERR.class.getCarer.3.2.3',
      message: '반의 보호자 목록을 조회할 권한이 없습니다.',
    });

  EXEC_STEP = '3.3'; // #3.2 carer 검색
  const qMems = await QTS.getCarer.fQuery(baseUrl, {
    schoolId,
    classId,
    kidId,
  });
  if (qMems.type === 'error')
    return qMems.onError(res, '3.3.1', 'searching member');

  const carer = qMems.message.rows[0];

  EXEC_STEP = '3.4'; // 가족 검색
  const qFam = await QTS.getFamily.fQuery(baseUrl, {
    schoolId,
    classId,
    kidId,
  });
  if (qFam.type === 'error')
    return qFam.onError(res, '3.4.1', 'searching family');

  const family = qFam.message.rows;

  return RESPOND(res, {
    carer,
    family,
    message: '해당 반의 보호자 정보를 성공적으로 반환했습니다.',
    resultCode: 200,
  });
}
