import { GranKind, LineCat } from '../types';

export const LINE_LABEL: Record<LineCat, string> = {
    [LineCat.All]: 'All Lines',
    [LineCat.Code]: 'Code',
    [LineCat.CodeWithComments]: 'Code + Comments',
    [LineCat.CodeNoComments]: 'Code (No Comments)',
    [LineCat.Comments]: 'Comment Lines',
    [LineCat.CommentsNet]: 'Comment Lines (Net)',
    [LineCat.Test]: 'Tests',
    [LineCat.Docs]: 'Docs',
    [LineCat.Config]: 'Config',
    [LineCat.Deps]: 'Dependencies',
    [LineCat.Gen]: 'Generated',
};

export const GRAN_LABEL: Record<GranKind, string> = {
    [GranKind.Auto]: 'Auto',
    [GranKind.Day]: 'Day',
    [GranKind.Week]: 'Week',
    [GranKind.Month]: 'Month',
    [GranKind.Year]: 'Year',
};
