import { GranKind, LineCat } from '../types';

export const LINE_LABEL: Record<LineCat, string> = {
    [LineCat.All]: 'All lines',
    [LineCat.Code]: 'Code',
    [LineCat.CodeWithComments]: 'Code + comments',
    [LineCat.CodeNoComments]: 'Code (no comments)',
    [LineCat.Comments]: 'Comment lines',
    [LineCat.CommentsNet]: 'Comment lines (net)',
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
