/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');

class NodeContract extends Contract {

    async getPrivate(ctx, key) {
        let result = await ctx.stub.getPrivateData("FishPrivateData", key);
        return result.toString('utf8');
    }

    async exists(ctx, key) {
        const buffer = await ctx.stub.getState(key);
        return (!!buffer && buffer.length > 0);
    }

    async set(ctx, key, value) {
        await ctx.stub.putState(key, value);
        let transientData = ctx.stub.getTransient();
        var data = transientData.get('"FishPrivateData"');
        await ctx.stub.putPrivateData("FishPrivateData", key, data);

        return value;
    }

    async get(ctx, key) {
        const exists = await this.exists(ctx, key);
        if (!exists) {
            throw new Error(`The key ${key} does not exist`);
        }
        let result = await ctx.stub.getState(key);
        let privateData = await ctx.stub.getPrivateData("FishPrivateData", key);
        let fish = Object.assign(JSON.parse(result.toString()), JSON.parse(privateData.toString()));
        return fish;
    }

    async getHistory(ctx, key) {
        let allResults = [];
        let resultsIterator = await ctx.stub.getHistoryForKey(key);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {

                jsonRes.transactionId = res.value.tx_id;
                jsonRes.timeStamp = res.value.timestamp.seconds.low;
                try {
                    jsonRes.asset = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.asset = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                return allResults;
            }

        }

    }

    async delete(ctx, key) {
        const exists = await this.exists(ctx, key);
        if (!exists) {
            throw new Error(`The key ${key} does not exist`);
        }
        await ctx.stub.deleteState(key);
        return "Object with id:" + key + " successfully deleted";
    }

    async query(ctx, query) {
        let allResults = [];
        let resultsIterator = await ctx.stub.getQueryResult(query);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    jsonRes = (JSON.parse(res.value.value.toString('utf8')));
                } catch (err) {
                    console.log(err);
                    jsonRes = (res.value.value.toString('utf8'));
                }
                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                return allResults;
            }

        }

    }

    async queryWithPagination(ctx, args) {

        if (args.length < 3) {
            return shim.Error("Incorrect number of arguments. Expecting 3");
        }

        const queryString = args[0];
        const pageSize = 5;
        const bookmark = args[2];

        let allResults = [];
        const {resultsIterator, metadata} = await ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    jsonRes = (JSON.parse(res.value.value.toString('utf8')));
                } catch (err) {
                    console.log(err);
                    jsonRes = (res.value.value.toString('utf8'));
                }
                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                allResults.ResponseMetadata = {
                    RecordsCount: metadata.fetched_records_count,
                    Bookmark: metadata.bookmark
                };
                return allResults;
            }

        }

    }

}
;




module.exports = NodeContract;
