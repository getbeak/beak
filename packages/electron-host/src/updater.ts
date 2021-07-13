import { autoUpdater } from 'electron-updater';

import logger from './lib/logger';

autoUpdater.logger = logger;
