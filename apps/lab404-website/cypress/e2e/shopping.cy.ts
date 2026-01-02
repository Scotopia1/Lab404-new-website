describe('Shopping Flow', () => {
    beforeEach(() => {
        // Clear cookies/local storage to start fresh
        cy.clearLocalStorage()
    })

    it('should allow a user to browse, add to cart, and checkout', () => {
        // 1. Browse Products
        cy.visit('/products')
        cy.contains('Featured Products').should('not.exist') // Ensure we are on listing page

        // Click on the first product
        cy.get('a[href^="/products/"]').first().click()

        // 2. Product Detail & Add to Cart
        cy.url().should('include', '/products/')
        cy.contains('Add to Cart').click()

        // Verify toast or cart update
        // cy.contains('Added to cart').should('be.visible')

        // 3. Open Cart Sidebar
        cy.get('button:has(svg.lucide-shopping-cart)').click()
        cy.contains('Checkout').click()

        // 4. Checkout
        cy.url().should('include', '/checkout')

        // Fill Shipping Info
        cy.get('input[name="firstName"]').type('John')
        cy.get('input[name="lastName"]').type('Doe')
        cy.get('input[name="email"]').type('john@example.com')
        cy.get('input[name="address"]').type('123 Main St')
        cy.get('input[name="city"]').type('New York')
        cy.get('input[name="state"]').type('NY')
        cy.get('input[name="zipCode"]').type('10001')
        cy.get('input[name="country"]').type('USA')

        // Fill Payment Info
        cy.get('input[name="cardNumber"]').type('0000000000000000')
        cy.get('input[name="expiryDate"]').type('12/25')
        cy.get('input[name="cvc"]').type('123')

        // Submit Order
        cy.contains('Place Order').click()

        // 5. Success
        cy.url().should('include', '/checkout/success')
        cy.contains('Order Placed Successfully').should('be.visible')
    })
})
