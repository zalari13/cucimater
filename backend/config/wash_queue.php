<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Kuota Antrian Cuci Harian
    |--------------------------------------------------------------------------
    |
    | Jumlah maksimal kendaraan yang bisa dicuci per hari, dikelompokkan
    | berdasarkan jenis kendaraan (vehicle_type). Jika kuota sebuah hari penuh,
    | pesanan baru otomatis dijadwalkan ke hari berikutnya yang masih tersedia.
    |
    | Key dicocokkan secara case-insensitive dengan nilai vehicle_type.
    |
    */
    'daily_limits' => [
        'mobil' => 5,
        'motor' => 2,
    ],

    // Kuota default untuk jenis kendaraan yang tidak terdaftar di atas.
    'default_limit' => 5,

    // Status pesanan yang tetap memakai slot antrian (pesanan dibatalkan
    // membebaskan slotnya sehingga bisa dipakai pesanan lain).
    'active_statuses' => ['pending', 'confirmed', 'completed'],
];
