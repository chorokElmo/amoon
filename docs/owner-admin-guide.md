# Amoon owner guide — native development

Open [Medusa Admin](http://localhost:9001/app) and sign in with your existing owner account. No Docker is required for the current local setup. Keep the PostgreSQL, backend and storefront processes running. Never share the ignored environment files, invitation links or passwords.

## Store configuration

The configured storefront sales channel is **Amoon Storefront**, the region is **Maroc** with **MAD**, and the delivery location is **Amoon Collection**. The location is connected to the sales channel and manual fulfillment. **Livraison gratuite au Maroc** costs **0 MAD**; checkout uses manual cash on delivery.

In Admin settings, open Locations and enter the actual dispatch street address and city for Amoon Collection. The project deliberately leaves these blank. Review the Morocco delivery coverage against where you actually deliver before taking orders.

From the project directory in CMD, run:

```cmd
npm run check:operations
```

This reports configuration checks, published product photo/inventory flags and an order count. It reads the database without creating or changing records, and excludes customer details and credentials. It does not prove that fulfillment or cash collection has occurred.

## Products and stock

Open Products and edit your actual products. Supply accurate descriptions, photographs, variants and MAD prices, then publish them in Amoon Storefront. Your existing `test` product has an owner-approved price of 150 MAD.

For stock you want Medusa to track, configure the actual variant inventory item, enable inventory management and enter counted quantities at Amoon Collection. Review its sales-channel availability. The existing variant currently has inventory management disabled; the store does not claim a counted stock quantity. Do not enable backorders unless you actually accept them. [Medusa inventory guide](https://docs.medusajs.com/user-guide/inventory/inventory).

## First real order

Use [checkout](http://localhost:8000/commande) with a real recipient's delivery details. Review the displayed product, quantity, free delivery and final MAD total, then confirm cash on delivery. No sample recipient or order is created by setup.

Find the resulting reference in Admin Orders. Check the customer/address, items, channel, shipping method, total and COD metadata against checkout. Refresh the confirmation or recover it from the same browser cart if a network response was lost; check Admin before ordering again. The read-only Phase 8 audit found order #1 with total 150 MAD, free delivery and COD metadata. Customer/receipt verification and actual delivery/cash collection remain outstanding.

## Processing a COD order

1. Confirm the real customer's delivery details and actual stock before preparing the parcel.
2. In the order's unfulfilled items, choose **Fulfill items**, select Amoon Collection and the actual items/quantities to pack. Manual fulfillment does not book a courier. [Medusa fulfillment guide](https://docs.medusajs.com/user-guide/orders/fulfillments).
3. Arrange actual delivery yourself. Record a real tracking reference when available. Mark shipped only when handed over, and delivered only after delivery is confirmed. These status transitions are irreversible in Medusa. [Shipment and delivery actions](https://docs.medusajs.com/user-guide/orders/fulfillments).
4. When the cash is actually received and reconciled, use the order payment section to capture the appropriate amount. The manual provider records the payment; it does not move money or collect from the customer. Never capture simply because an order was placed. [Medusa payment guide](https://docs.medusajs.com/user-guide/orders/payments).

Customer notifications are not configured. Admin notification controls alone do not guarantee an email or WhatsApp message. Partial deliveries, cancellations, returns and refunds need review of the actual order state and any cash already exchanged before using Admin actions.

Production hosting, automated courier integrations and verified backups/restore remain separate work. The current native setup is intended for development.
