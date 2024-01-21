import { MongoClient } from "npm:mongodb";
import env from "./env.ts";

/////////////////////////
const CURRENT_VERSION = 3;
/////////////////////////

export interface GroupData {
    _id: number;
    flameEnabled: boolean;
    lastPinnedMessageId?: number;
    flameMessageId?: number;
    flamers: { [userId: string]: number };
    flameStartedAt?: number;
    popcorns: {
        [type: string]: {
            emoji: string;
            takenTimes: number;
            takenBy?: number[];
        };
    },
    settings: {
        // deno-lint-ignore no-explicit-any
        [key: string]: any;
    },
    version?: number;
}

const defaultPopcornTypes = {
    buttered: { emoji: "🍿", takenTimes: 0 },
    caramel: { emoji: "🍯", takenTimes: 0 },
    cheese: { emoji: "🧀", takenTimes: 0 },
    spicy: { emoji: "🌶️", takenTimes: 0 },
    sweet: { emoji: "🍬", takenTimes: 0 },
};

const client = new MongoClient(env["MONGO_URI"]);
await client.connect();
const db = client.db("popcorn");
const groups = db.collection<GroupData>("groups");

export async function fetchGroup(id: number): Promise<GroupData> {
    const group = await groups.findOne({ _id: id });
    if (!group) {
        await groups.insertOne({
            _id: id,
            flameEnabled: false,
            flamers: {},
            popcorns: defaultPopcornTypes,
            settings: {
                announceWhenTakingPopcorn: true,
                anonymousPopcorn: false,
            },
            version: CURRENT_VERSION,
        });
    }
    return group!;
}

export async function updateAllData() {
    const allGroups = await groups.find().toArray();
    const bulkOperations = [];

    for (const group of allGroups) {
        let version = group.version;
        if (!version) {
            group.settings = {
                // Announce when user takes a popcorn
                announceWhenTakingPopcorn: true,
                // Allow users to take popcorns anonymously
                anonymousPopcorn: false,
                // Do not allow admins to pin other messages than the flame message
                forceMessagePinning: true,
            };
            group.flameMessageId = undefined;
            version = 3;
        }
        if (version === 2) {
            // Do not allow admins to pin other messages than the flame message
            group.settings.forceMessagePinning = true;
            group.flameMessageId = undefined;
            version = 3;
        }

        if (version !== CURRENT_VERSION) {
            bulkOperations.push({
                updateOne: {
                    filter: { _id: group._id },
                    update: { $set: group },
                },
            });
        }
    }

    if (bulkOperations.length > 0) {
        console.log(`Updating database (${bulkOperations.length} groups)...`);
        await groups.bulkWrite(bulkOperations);
    }
}

export default groups;