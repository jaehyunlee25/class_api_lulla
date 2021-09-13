import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  newClass: 'newClass',
  getCBI: 'getClassById',
};
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

  // #3. 작업
  setBaseURL('sqls/class/class'); // 끝에 슬래시 붙이지 마시오.
  try {
    if (req.method === 'POST') return await post(req, res);
    if (req.method === 'GET') return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.class.check.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
  return true;
}
async function post(req, res) {
  // #3.0. 사용자 토큰을 이용해 유효성을 검증하고, 필요하면 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;

  // #3.1.
  const {
    class_name: className,
    class_start_date: classStartDate,
    class_end_date: classEndDate,
    class_description: classDescription,
    member_id: memberId,
  } = req.body;

  // #3.2.
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    qMember.onError(res, '3.2', 'fatal error while searching member');

  // #3.3.
  const { schoolId, grade } = qMember.message;

  if (grade !== 1)
    ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.school.3.3',
      message: '생성 권한이 없습니다.',
    });

  // #3.4.
  const qClass = await QTS.newClass.fQuery({
    className,
    classStartDate,
    classEndDate,
    classDescription,
    schoolId,
  });
  if (qClass.type === 'error')
    return qClass.onError(res, '3.4', 'creating class');

  const classId = qClass.message.rows[0].id;

  // #3.5.
  const qCBI = await QTS.getCBI.fQuery({ classId });
  if (qCBI.type === 'error') return qCBI.onError(res, '3.5', 'searching class');

  const classes = qCBI.message.rows[0];

  return RESPOND(res, {
    classes,
    resultCode: 200,
  });
}
async function get(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;
  console.log(userId);
  // #3.2 userId와 memberId가 같은 멤버 조회
  // #3.2.1 memberId 유효성 점검
  const { member_id: memberId, search } = req.query;
  if (!memberId)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.1',
      message: 'member_id의 형식이 올바르지 않습니다.',
    });
  // #3.2.2 member 검색
  const qMIUI = await QTS.getMIUI.fQuery({ userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const {
    school_id: schoolId,
    /* class_id: classId,
    kid_id: kidId,
    grade, */
  } = qMIUI.message.rows[0];
  if (req.query.search) {
    // #3.3.1 검색어가 있는 경우
    const qSSD = await QTS.getSSD.fQuery({ search });
    if (qSSD.type === 'error')
      return qSSD.onError(res, '3.3.2.1', 'searching school');
    return RESPOND(res, {
      data: qSSD.message.rows,
      message: '해당하는 어린이집 리스트를 반환하였습니다.',
      resultCode: 200,
    });
  }
  // #3.3.2 검색어가 없는 경우
  const qSDBI = await QTS.getSDBI.fQuery({ schoolId });
  if (qSDBI.type === 'error')
    return qSDBI.onError(res, '3.3.2.1', 'searching school');
  if (qSDBI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.school.3.3.2.2',
      message: '해당하는 어린이집 데이터가 존재하지 않습니다.',
    });
  return RESPOND(res, {
    data: qSDBI.message.rows[0],
    message: '해당 어린이집 조회에 성공하였습니다.',
    resultCode: 200,
  });
}
