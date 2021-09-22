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
  gCIBCI: 'getClassInfoByClassId',
  gCIBSI: 'getClassInfoBySchoolId',
  gCIBMCI: 'getClassInfoByMemberClassId',
};
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    description: classDescription,
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
    return qMember.onError(res, '3.2', 'fatal error while searching member');

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
  // #3.0. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.1.
  const classId = req.query.id;
  const memberId = req.query.member_id;

  console.log(userId, memberId);

  // #3.2.
  const qMember = await POST(
    'school', // domain header
    '/checkMember', // url
    { 'Content-Type': 'application/json' }, // header
    { userId, memberId }, // parameter
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');

  // #3.3.
  const { schoolId, classId: memberClassId, grade } = qMember.message;

  // #3.4. 조회하고자 하는 classId가 있으면 해당 classId의 정보를 찾는다.
  let qClass;
  if (classId) {
    qClass = await QTS.gCIBCI.fQuery({ classId });
    if (qClass.type === 'error')
      return qClass.onError(res, '3.4', 'searching class by id');
    if (qClass.message.rows.length === 0)
      ERROR(res, {
        resultCode: 204,
        id: 'ERR.school.school.3.3',
        message: '해당하는 데이터가 존재하지 않습니다.',
      });
    return RESPOND(res, {
      data: userId,
      message: '해당하는 데이터를 성공적으로 반환하였습니다.',
      resultCode: 200,
    });
  }

  // #3.5. 조회하고자 하는 classId가 없으면 모든 class의 정보를 찾는다.
  if (grade <= 2) {
    qClass = await QTS.gCIBSI.fQuery({ schoolId });
    if (qClass.type === 'error')
      return qClass.onError(res, '3.5.1', 'searching class');
  } else if (grade <= 5) {
    qClass = await QTS.gCIBMCI.fQuery({ memberClassId });
    if (qClass.type === 'error')
      return qClass.onError(res, '3.5.2', 'searching class');
  }

  return RESPOND(res, {
    classes: qClass.message.rows,
    message: '해당하는 데이터를 성공적으로 반환하였습니다.',
    resultCode: 200,
  });
}
