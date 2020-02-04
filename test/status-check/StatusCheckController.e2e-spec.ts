import {INestApplication} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import request from "supertest";
import {StatusCheckModule} from "../../src/status-check";

describe("StatusCheckController tests", () => {
    let app: INestApplication;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [StatusCheckModule]
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    describe("GET /api/v1/status tests", () => {
        it("Returns 200 status and its status is 'UP'", () => {
            return request(app.getHttpServer())
                .get("/api/v1/status")
                .expect(200)
                .expect(JSON.stringify({status: "UP"}))
        })
    })
});
