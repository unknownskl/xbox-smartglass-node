import Session from '../lib/Session'

export default class TvRemote {

    _id
    _session

    load(session:Session, channelNum) {
        this._session = session
        this._id = channelNum
        this._session._client._logger.log('[channels/TvRemote.ts] Creating TVRemote manager (' + this._id + ')')
    }
}