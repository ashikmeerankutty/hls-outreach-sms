'use strict';
/* --------------------------------------------------------------------------------
 * list executions of studio flow specified via event.flowName
 *
 * event:
 * . flowSid: SID of studio flow
 *
 * returns:
 * - json array of execution SIDs, if successful
 * --------------------------------------------------------------------------------
 */

const assert = require("assert");
exports.handler = async function(context, event, callback) {
  const THIS = 'list-executions:';

  const assert = require('assert');
  const { getParam } = require(Runtime.getFunctions()['helpers'].path);
  const { isValidAppToken } = require(Runtime.getFunctions()["authentication-helper"].path);

  /* Following code checks that a valid token was sent with the API call */
  if (!isValidAppToken(event.token, context)) {
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(401);
    response.setBody({message: 'Invalid or expired token'});
    return callback(null, response);
  }

  console.time(THIS);
  try {
    assert(event.flowSid, 'missing event.flowSid!!!');

    const client = context.getTwilioClient();
    const executions = await client.studio.flows(event.flowSid).executions.list();
    const response = executions
      .filter(e => e.status === 'ended') // TODO: may need to restrict to last hour, etc. if there are too many
      .map(e => e.sid);

    return callback(null, response);

  } catch (err) {
    console.log(THIS, err);
    return callback(err);
  } finally {
    console.timeEnd(THIS);
  }
};
