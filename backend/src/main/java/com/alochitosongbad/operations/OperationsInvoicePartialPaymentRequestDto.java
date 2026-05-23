package com.alochitosongbad.operations;

import java.math.BigDecimal;

public class OperationsInvoicePartialPaymentRequestDto {

    private BigDecimal paidAmount;

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }
}
