/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');

class FishContract extends Contract {

    async fishExists(ctx, fishId) {
        const buffer = await ctx.stub.getState(fishId);
        return (!!buffer && buffer.length > 0);
    }

    async set(ctx, fishId, value) {
        await ctx.stub.putState(fishId, value);
        return value;
    }

    async get(ctx, fishId) {
        const exists = await this.fishExists(ctx, fishId);
        if (!exists) {
            throw new Error(`The fish ${fishId} does not exist`);
        }
        let result = await ctx.stub.getState(fishId);
        return JSON.parse(result.toString());
    }

    async delete(ctx, fishId) {
        const exists = await this.fishExists(ctx, fishId);
        if (!exists) {
            throw new Error(`The fish ${fishId} does not exist`);
        }
        await ctx.stub.deleteState(fishId);
        return "Fish with id:" + fishId + " successfully deleted";
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




module.exports = FishContract;
