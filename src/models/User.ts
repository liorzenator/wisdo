import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { DOMAIN_EVENTS, domainEvents } from '../utils/domainEvents.js';

export interface IUser extends Document {
    _id: Types.ObjectId;
    id: string;
    username: string;
    password?: string;
    country: string;
    libraries: Types.ObjectId[];
    role?: 'admin' | 'user';
    refreshTokens: { token: string, replacedBy?: string }[];
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    libraries: [{ type: Schema.Types.ObjectId, ref: 'Library' }],
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    refreshTokens: [{ 
        token: { type: String },
        replacedBy: { type: String }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password!, salt);
    } catch (error: any) {
        throw error;
    }
});

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

export const userPostSaveHook = function(this: any, doc: IUser) {
    // Only refresh if libraries were modified.
    const modified = typeof this.modifiedPaths === 'function' ? this.modifiedPaths() : [];
    if (Array.isArray(modified) && modified.includes('libraries')) {
        domainEvents.emit(DOMAIN_EVENTS.USER_LIBRARIES_UPDATED, doc._id);
    }
};

userSchema.index({ 'refreshTokens.token': 1 });

userSchema.post('save', function(this: any, doc) {
    userPostSaveHook.call(this, doc as IUser);
});

export const User = model<IUser>('User', userSchema);
