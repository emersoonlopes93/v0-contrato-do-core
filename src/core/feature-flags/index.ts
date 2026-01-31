export * from "./contracts";

import { MemoryFeatureFlagProvider } from "./memory-feature-flag.service";

export const globalFeatureFlagProvider = new MemoryFeatureFlagProvider();

