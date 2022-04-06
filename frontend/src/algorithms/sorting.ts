type ComparisonResult = -1 | 0 | 1;

type Comparator<T> = (left: T, right: T) => ComparisonResult;

const defaultComparator = <T>(left: T, right: T): ComparisonResult => {
    if (left < right) {
        return -1;
    }
    if (left > right) {
        return 1;
    }
    return 0;
};

export const projectionComparator = <TOriginal, TProjection>(mapping: (original: TOriginal) => TProjection): Comparator<TOriginal> =>
    (left: TOriginal, right: TOriginal): ComparisonResult =>
        defaultComparator(mapping(left), mapping(right));
