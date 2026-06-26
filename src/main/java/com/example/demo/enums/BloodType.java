package com.example.demo.enums;

import java.util.List;
import java.util.Map;

public enum BloodType {
    A_POSITIVE,
    A_NEGATIVE,
    B_POSITIVE,
    B_NEGATIVE,
    AB_POSITIVE,
    AB_NEGATIVE,
    O_POSITIVE,
    O_NEGATIVE;

    public static final Map<BloodType, List<BloodType>> CompatibleBloodMap = Map.of(
            A_POSITIVE, List.of(A_POSITIVE, A_NEGATIVE, O_POSITIVE, O_NEGATIVE),
            A_NEGATIVE, List.of(A_NEGATIVE, O_NEGATIVE),
            B_POSITIVE, List.of(B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE),
            B_NEGATIVE, List.of(B_NEGATIVE, O_NEGATIVE),
            AB_POSITIVE, List.of(A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE),
            AB_NEGATIVE, List.of(A_NEGATIVE, B_NEGATIVE, AB_NEGATIVE, O_NEGATIVE),
            O_POSITIVE, List.of(O_POSITIVE, O_NEGATIVE),
            O_NEGATIVE, List.of(O_NEGATIVE)
    );

}
