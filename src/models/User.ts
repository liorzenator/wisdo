import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: Types.ObjectId;
    id: string;
    username: string;
    password?: string;
    country: string;
    libraries: Types.ObjectId[];
    role?: 'admin' | 'user';
    refreshTokens: string[];
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    libraries: [{ type: Schema.Types.ObjectId, ref: 'Library' }],
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    refreshTokens: [{ type: String }]
}, {
    timestamps: true,
    strict: true,
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

export const User = model<IUser>('User', userSchema);
