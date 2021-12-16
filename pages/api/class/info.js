import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getInfo: 'getClassInfoById',
};
const baseUrl = 'sqls/class/info'; // 끝에 슬래시 붙이지 마시오.

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리
  // if (req.method === 'OPTIONS') return RESPOND(res, {});

  // #3. 작업
  setBaseURL('sqls/class/info'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.class.check.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.0. 사용자 토큰을 이용해 유효성을 검증하고, 필요하면 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  // const userId = qUserId.message;

  // #3.1.
  const { id: schoolId } = req.query;

  // #3.2.
  const qClass = await QTS.getInfo.fQuery(baseUrl, { schoolId });
  if (qClass.type === 'error')
    return qClass.onError(res, '3.4', 'searching class');

  const datas = qClass.message.rows;

  return RESPOND(res, {
    datas,
    resultCode: 200,
  });
}
