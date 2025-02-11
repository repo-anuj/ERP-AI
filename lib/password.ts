export async function hashPassword(password: string): Promise<string> {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')

    // Convert password to buffer
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    // Generate key using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    )

    const derivedKey = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    )

    // Convert derived key to hex
    const hashArray = Array.from(new Uint8Array(derivedKey))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Return salt and hash combined
    return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
        // Split stored hash into salt and hash
        const [saltHex, hashHex] = storedHash.split(':')
        if (!saltHex || !hashHex) return false

        // Convert salt from hex to Uint8Array
        const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

        // Generate key using same parameters
        const encoder = new TextEncoder()
        const passwordBuffer = encoder.encode(password)

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        )

        const derivedKey = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        )

        // Convert derived key to hex
        const hashArray = Array.from(new Uint8Array(derivedKey))
        const compareHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Compare hashes
        return hashHex === compareHashHex
    } catch (error) {
        console.error('Error verifying password:', error)
        return false
    }
} 