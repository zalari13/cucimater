<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'access_token',
        'vehicle_type',
        'vehicle_brand',
        'vehicle_plate',
        'vehicle_criteria',
        'notes',
        'status',
        'scheduled_date',
        'queue_number',
        'resi_number',
        'subtotal',
        'total',
        'confirmed_by',
        'confirmed_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
            'scheduled_date' => 'date',
            'queue_number' => 'integer',
            'confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Nama pemesan (dari akun user jika login, atau data tamu).
     */
    public function customerName(): string
    {
        return $this->user?->name ?? $this->customer_name ?? '-';
    }

    /**
     * Email pemesan (dari akun user jika login, atau data tamu).
     */
    public function customerEmail(): ?string
    {
        return $this->user?->email ?? $this->customer_email;
    }

    /**
     * Nomor telepon/WhatsApp pemesan (dari akun user jika login, atau data tamu).
     */
    public function customerPhone(): ?string
    {
        return $this->user?->phone ?? $this->customer_phone;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasOne<Payment, $this>
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
